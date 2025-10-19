import app from 'flarum/common/app';
import { override } from 'flarum/common/extend';
import DiscussionListState from 'flarum/forum/states/DiscussionListState';
import Stream from 'flarum/common/utils/Stream';
import determineMode from './utils/determineMode';

// --- URL 持久化工具 ---
function getPageFromURL() {
  try {
    const p = new URL(window.location.href).searchParams.get('page');
    const n = parseInt(p, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}
/** 将页码写到地址栏，并同步 Mithril 的当前路由项（replace，不新增历史） */
function setPageToURL(n, replace = true) {
  try {
    const u = new URL(window.location.href);
    if (n <= 1) u.searchParams.delete('page');
    else u.searchParams.set('page', String(n));
    const newUrl = u.pathname + u.search + u.hash;

    const mAny = (window && window.m) || null;
    if (mAny && mAny.route && typeof mAny.route.set === 'function') {
      mAny.route.set(newUrl, undefined, { replace: true });
    } else {
      (replace ? history.replaceState : history.pushState).call(history, null, '', newUrl);
    }
  } catch {}
}

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

  // 参数刷新 -> 回到第 1 页（保持原行为）
  override(DiscussionListState.prototype, 'refreshParams', function (original, params, page = 1) {
    const ret = original(params, page);
    if (this.usePaginationMode && typeof this.refresh === 'function') {
      const goPage = 1;
      return Promise.resolve(ret).then(() => this.refresh(goPage));
    }
    return ret;
  });

  // 刷新指定页（含：回退时用缓存直出，避免请求 + 静默恢复首帧不闪 Loading）
  override(DiscussionListState.prototype, 'refresh', function (original, page = 1) {
    if (!this.optionInitialized) this.initOptions();

    if (!this.usePaginationMode) {
      this.pageSize = this.options.perLoadMore;
      return original(page);
    }

    // 若未显式传或为 1，优先读 URL 的 ?page
    let targetPage = page;
    if (targetPage === undefined || targetPage === 1) {
      const u = getPageFromURL();
      if (u) targetPage = u;
    }

    // ===== 新增：缓存复用，不触发请求（仅在参数未变且缓存过该页时） =====
    const reqParams = this.requestParams();
    const includeChanged = JSON.stringify(reqParams['include']) !== JSON.stringify(this.lastRequestParams['include']);
    const filterChanged  = JSON.stringify(reqParams['filter'])  !== JSON.stringify(this.lastRequestParams['filter']);
    const sortChanged    = reqParams['sort'] !== this.lastRequestParams['sort'];

    if (
      this.options.cacheDiscussions &&
      !(includeChanged || filterChanged || sortChanged) &&
      this.lastLoadedPage[targetPage]
    ) {
      // ★ 一次性静默恢复：首帧不渲染 LoadingIndicator
      this.silentRestoreOnce = true;

      this.initialLoading = false;
      this.loadingPrev = false;
      this.loadingNext = false;
      this.isRefreshing = false;

      this.location = { page: targetPage };
      setPageToURL(targetPage, true);

      const start = this.options.perPage * (targetPage - 1);
      const end   = this.options.perPage * targetPage;
      const results = this.lastDiscussions.slice(start, end);
      results.payload = { jsonapi: { totalResultsCount: this.totalDiscussionCount() } };

      this.pages = [];
      this.parseResults(this.location.page, results);

      // 立即同步重绘，确保这一帧没有 Loading 的闪烁
      m.redraw.sync();
      // 复位标记（仅本次有效）
      setTimeout(() => (this.silentRestoreOnce = false), 0);

      return Promise.resolve(results); // 不发请求，直接结束
    }
    // ===== 新增分支结束 =====

    this.initialLoading = true;
    this.loadingPrev = false;
    this.loadingNext = false;
    this.isRefreshing = true;

    this.clear();
    this.location = { page: targetPage };
    setPageToURL(targetPage, true);

    return this.loadPage(targetPage)
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

    const preloadedDiscussions = app.preloadedApiDocument();
    if (preloadedDiscussions) {
      this.initialLoading = false;
      this.isRefreshing = false;
      this.totalDiscussionCount = Stream(preloadedDiscussions.payload.jsonapi.totalResultsCount);
      this.lastTotalDiscussionCount = this.totalDiscussionCount();
      return Promise.resolve(preloadedDiscussions);
    }

    // 本地缓存复用（参数未变）
    if (!this.isRefreshing && this.options.cacheDiscussions) {
      const includeChanged = JSON.stringify(reqParams['include']) !== JSON.stringify(this.lastRequestParams['include']);
      const filterChanged  = JSON.stringify(reqParams['filter'])  !== JSON.stringify(this.lastRequestParams['filter']);
      const sortChanged    = reqParams['sort'] !== this.lastRequestParams['sort'];

      if (!(includeChanged || filterChanged || sortChanged)) {
        if (this.lastLoadedPage[page]) {
          const start = this.options.perPage * (page - 1);
          const end = this.options.perPage * page;
          const results = this.lastDiscussions.slice(start, end);
          results.payload = { jsonapi: { totalResultsCount: this.totalDiscussionCount() } };

          this.initialLoading = true;
          m.redraw();
          return new Promise((resolve) => setTimeout(() => resolve(results), 50));
        }
      }
    }

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
          setPageToURL(current, true);
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
          setPageToURL(current, true);
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
          setPageToURL(target, true);
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

  // Realtime 新内容：分页模式下刷新第 1 页（保持原修复）
  override(DiscussionListState.prototype, 'addDiscussion', function (original, discussion) {
    if (!this.usePaginationMode) return original(discussion);

    clearTimeout(this.__rtRefreshTimer);
    this.__rtRefreshTimer = setTimeout(() => {
      this.page = this.page || Stream({ number: 1, items: [] });
      this.location = { page: 1 };
      this.refresh(1);
    }, 50);

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
    if (!this.usePaginationMode) return original(discussion);
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
