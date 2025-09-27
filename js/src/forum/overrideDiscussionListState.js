import app from 'flarum/common/app';
import { override } from 'flarum/common/extend';
import DiscussionListState from 'flarum/forum/states/DiscussionListState';
import Stream from 'flarum/common/utils/Stream';
import determineMode from './utils/determineMode';

/**
 * 最小修补要点：
 * - 修正 "!'ext' in obj" 括号优先级（两处）
 * - 修正 filter 对比键名（filter vs filter.q）
 * - 移除不可达 return
 * - 将 refreshParams → refresh() 串起来，确保 Realtime 黄条触发能刷新分页
 */
export default function () {
  // 初始化分页选项
  DiscussionListState.prototype.initOptions = function () {
    this.options = {
      cacheDiscussions: app.forum.attribute('foskym-pagination.cacheDiscussions'),
      perPage: app.forum.attribute('foskym-pagination.perPage'),
      perLoadMore: app.forum.attribute('foskym-pagination.perLoadMore'),
      perIndexInit: app.forum.attribute('foskym-pagination.perIndexInit'),
      leftEdges: 4,
      rightEdges: 5,
    };
    this.usePaginationMode = determineMode();
    this.lastTotalDiscussionCount = 0;
    this.lastTotalPages = 0;
    this.lastDiscussions = [];
    this.lastLoadedPage = {};
    this.lastRequestParams = {};
    this.optionInitialized = true;
  };

  // 关键：把参数刷新串到 refresh，保证分页模式下能正确更新
  override(DiscussionListState.prototype, 'refreshParams', function (original, params, page = this.location?.page ?? 1) {
    const ret = original(params, page);
    if (this.usePaginationMode && typeof this.refresh === 'function') {
      return Promise.resolve(ret).then(() => this.refresh(page));
    }
    return ret;
  });

  // 刷新指定页
  override(DiscussionListState.prototype, 'refresh', function (original, page = 1) {
    if (!this.optionInitialized) this.initOptions();

    if (!this.usePaginationMode) {
      this.pageSize = this.options.perLoadMore;
      return original(page);
    }

    this.initialLoading = true;
    this.loadingPrev = false;
    this.loadingNext = false;
    this.isRefreshing = true;

    this.clear();
    this.location = { page };

    return this.loadPage(page)
      .then((results) => {
        this.pages = [];
        this.parseResults(this.location.page, results);
      })
      .finally(() => {
        this.initialLoading = false;
        this.isRefreshing = false;
      });
  });

  // 加载某页
  override(DiscussionListState.prototype, 'loadPage', function (original, page = 1) {
    const reqParams = this.requestParams();
    if (!this.optionInitialized) this.initOptions();

    if (!this.lastRequestParams['include']) {
      this.lastRequestParams = reqParams;
    }

    // 首屏预载
    const preloadedDiscussions = app.preloadedApiDocument();
    if (preloadedDiscussions) {
      this.initialLoading = false;
      this.isRefreshing = false;
      this.totalDiscussionCount = Stream(preloadedDiscussions.payload.jsonapi.totalResultsCount);
      this.lastTotalDiscussionCount = this.totalDiscussionCount();
      return Promise.resolve(preloadedDiscussions);
    }

    // 本地缓存复用（请求参数未变化时）
    if (!this.isRefreshing && this.options.cacheDiscussions) {
      const includeChanged = JSON.stringify(reqParams['include']) !== JSON.stringify(this.lastRequestParams['include']);
      const filterChanged = JSON.stringify(reqParams['filter']) !== JSON.stringify(this.lastRequestParams['filter']);
      const sortChanged = reqParams['sort'] !== this.lastRequestParams['sort'];

      if (!(includeChanged || filterChanged || sortChanged)) {
        if (this.lastLoadedPage[page]) {
          const start = this.options.perPage * (page - 1);
          const end = this.options.perPage * page;
          const results = this.lastDiscussions.slice(start, end);
          results.payload = { jsonapi: { totalResultsCount: this.totalDiscussionCount() } };

          // 让卡片视图在 cache 模式下也能正确重绘
          this.initialLoading = true;
          m.redraw();
          return new Promise((resolve) => setTimeout(() => resolve(results), 50));
        }
      }
    }

    // 计算 offset/limit
    const include = Array.isArray(reqParams.include) ? reqParams.include.join(',') : reqParams.include;

    let newOffset, newLimit;
    if (this.usePaginationMode) {
      newOffset = this.options.perPage * (page - 1);
      newLimit = this.options.perPage;
    } else {
      newOffset = this.options.perIndexInit * Math.min(page - 1, 1) + this.options.perLoadMore * Math.max(page - 2, 0);
      newLimit = newOffset === 0 ? this.options.perIndexInit : this.options.perLoadMore;
    }

    const params = {
      ...reqParams,
      page: {
        ...reqParams.page,
        offset: newOffset,
        limit: newLimit,
      },
      include,
    };

    return app.store.find(this.type, params);
  });

  // cards 兼容：拿所有 items
  override(DiscussionListState.prototype, 'getAllItems', function (original) {
    if (!('walsgit-discussion-cards' in flarum.extensions)) return original();
    return this.extraDiscussions.concat(this.getPages(true).map((pg) => pg.items).flat());
  });

  // cards 兼容：仅返回当前页（或所有页）
  override(DiscussionListState.prototype, 'getPages', function (original, getAllPages = false) {
    const allPages = original();
    if (!('walsgit-discussion-cards' in flarum.extensions)) return allPages;
    if (getAllPages) return allPages;
    return [allPages.find((page) => page.number === this.location.page)];
  });

  // 解析结果并更新分页状态
  override(DiscussionListState.prototype, 'parseResults', function (original, pg, results) {
    if (!this.usePaginationMode) return original(pg, results);

    const pageNum = Number(pg);
    const links = results.payload?.links || {};
    const page = {
      number: pageNum,
      items: results,
      hasNext: !!links?.next,
      hasPrev: !!links?.prev,
    };

    this.hasPage = function (num) {
      const all = this.getPages(true);
      if (all.length === 0) return false;
      return all.some((p) => p.number === num);
    };

    if (!this.hasPage(pageNum)) {
      this.pages.push(page);
    }

    this.pages = this.pages.sort((a, b) => a.number - b.number);
    this.location = { page: pageNum };

    this.totalDiscussionCount = Stream(results.payload.jsonapi.totalResultsCount);

    if (this.options.cacheDiscussions) {
      if (
        (this.lastTotalDiscussionCount !== this.totalDiscussionCount() && this.lastTotalDiscussionCount !== 0) ||
        this.lastTotalDiscussionCount === 0 ||
        this.isRefreshing
      ) {
        // 重置缓存
        this.lastTotalDiscussionCount = this.totalDiscussionCount();
        this.lastDiscussions = new Array(this.lastTotalDiscussionCount);
        this.lastLoadedPage = {};
      } else {
        // 继续累积缓存
        this.lastLoadedPage[pageNum] = page;
        const start = this.options.perPage * (pageNum - 1);
        const end = this.options.perPage * pageNum;
        this.lastDiscussions.splice(start, end - start, ...results);
      }
    }

    this.getTotalPages = function () {
      return Math.ceil(this.totalDiscussionCount() / this.options.perPage);
    };

    this.page = Stream(page);
    this.perPage = Stream(this.options.perPage);
    this.totalPages = Stream(this.getTotalPages());

    this.ctrl = {
      scrollToTop: function () {
        const container = document.querySelector('#content > .IndexPage > .container');
        const header = document.querySelector('#header');
        let offsetY = 0;
        if (header) offsetY = header.clientHeight;
        if (container) {
          const target = container.getBoundingClientRect().top + window.scrollY - offsetY;
          setTimeout(() => window.scrollTo({ top: target, behavior: 'smooth' }), 50);
        }
      }.bind(this),

      prevPage: function () {
        let current = this.page().number - 1;
        if (current < 1) return;
        this.page(current);
        this.loadingPrev = true;
        this.loadPage(current).then((r) => {
          this.parseResults(current, r);
          this.loadingPrev = false;
          this.ctrl.scrollToTop();
        });
      }.bind(this),

      nextPage: function () {
        let current = this.page().number + 1;
        if (current > this.totalPages()) {
          current = this.totalPages();
          return;
        }
        this.page(current);
        this.loadingNext = true;
        this.loadPage(current).then((r) => {
          this.parseResults(current, r);
          this.loadingNext = false;
          this.ctrl.scrollToTop();
        });
      }.bind(this),

      toPage: function (page) {
        const target = Number(page);
        if (this.page().number === target || target < 1 || target > this.totalPages()) return;
        this.page(target);
        this.initialLoading = true;
        this.loadPage(target).then((r) => {
          this.parseResults(target, r);
          this.initialLoading = false;
          this.ctrl.scrollToTop();
        });
      }.bind(this),

      pageList: function () {
        const p = [];
        const left = Math.max(parseInt(this.page().number) - this.options.leftEdges, 1);
        const right = Math.min(parseInt(this.page().number) + this.options.rightEdges, this.totalPages());
        for (let i = left; i <= right; i++) p.push(i);
        return p;
      }.bind(this),
    };

    m.redraw();
  });

  // 新增/删除讨论的本地同步（分页模式）
  override(DiscussionListState.prototype, 'addDiscussion', function (original, discussion) {
    if (!this.usePaginationMode) return original();
    const index = this.lastDiscussions.indexOf(discussion);
    if (index !== -1) {
      this.lastDiscussions.splice(index);
      this.lastDiscussions.unshift(discussion);
    } else {
      this.lastDiscussions.unshift(discussion);
      this.lastTotalDiscussionCount++;
      this.totalDiscussionCount(this.lastTotalDiscussionCount);
    }
    m.redraw();
  });

  override(DiscussionListState.prototype, 'deleteDiscussion', function (original, discussion) {
    if (!this.usePaginationMode) return original();
    const index = this.lastDiscussions.indexOf(discussion);
    if (index !== -1) {
      this.lastDiscussions.splice(index);
      this.lastTotalDiscussionCount--;
      this.totalDiscussionCount(this.lastTotalDiscussionCount);
    }
    m.redraw();
  });

  // 清理状态
  override(DiscussionListState.prototype, 'clear', function (original) {
    if (!this.usePaginationMode) return original();
    this.lastDiscussions = [];
    this.lastLoadedPage = {};
    this.lastRequestParams = {};
    this.lastTotalDiscussionCount = 0;
    this.lastTotalPages = 0;
    this.totalDiscussionCount = Stream(0);
    return original();
  });
}
