import app from 'flarum/common/app';
import { override } from 'flarum/common/extend';
import DiscussionListState from 'flarum/forum/states/DiscussionListState';
import Stream from 'flarum/common/utils/Stream';

import determineMode from './utils/determineMode';

export default function () {
  DiscussionListState.prototype.initOptions = function () {
    this.options = {
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
    this.lastRquestParams = {};

    this.optionInited = true;
  };

  override(DiscussionListState.prototype, 'refresh', function (original, page = 1) {
    if (!this.optionInited) this.initOptions();

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

  override(DiscussionListState.prototype, 'loadPage', function (original, page = 1) {
    const reqParams = this.requestParams();
    if (!this.optionInited) this.initOptions();
    if (!this.lastRquestParams['include']) {
      this.lastRquestParams = reqParams;
    }
    if (!this.isRefreshing) {
      if (
        JSON.stringify(reqParams['include']) !== JSON.stringify(this.lastRquestParams['include']) ||
        reqParams['filter.q'] === this.lastRquestParams['filter.q'] ||
        reqParams['sort'] === this.lastRquestParams['sort']
      ) {
        if (this.lastLoadedPage[page]) {
          let start = this.options.perPage * (page - 1);
          let end = this.options.perPage * page;
          let results = this.lastDiscussions.slice(start, end);
          results.payload = { jsonapi: { totalResultsCount: this.totalDiscussionCount() } };
          return Promise.resolve(results);
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
      newLimit = newOffset == 0 ? this.options.perIndexInit : this.options.perLoadMore;
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

  override(DiscussionListState.prototype, 'parseResults', function (original, pg, results) {
    if (!this.usePaginationMode) {
      return original(pg, results);
    }
    const pageNum = Number(pg);

    const links = results.payload?.links || {};

    const page = {
      number: pageNum,
      items: results,
      hasNext: !!links?.next,
      hasPrev: !!links?.prev,
    };

    this.hasPage = function (page) {
      let allPages = this.getPages();
      if (allPages.length == 0) return false;
      for (let i = 0; i < allPages.length; i++) {
        if (allPages[i].number == page) return true;
      }
      return false;
    };

    if (!this.hasPage(pageNum)) {
      this.pages.push(page);
    }

    this.location = { page: pageNum };

    this.totalDiscussionCount = Stream(results.payload.jsonapi.totalResultsCount);

    if ((this.lastTotalDiscussionCount != this.totalDiscussionCount() && this.lastTotalDiscussionCount != 0) || this.lastTotalDiscussionCount === 0 || this.isRefreshing) {
      // need to update the discussion list
      this.lastTotalDiscussionCount = this.totalDiscussionCount();
      for (let i = 0; i < this.lastTotalDiscussionCount; i++) {
        this.lastDiscussions[i] = {};
      }
      this.lastLoadedPage = {};
    } else {
      // no need to update the discussion list
      this.page = Stream(page);
      this.lastLoadedPage[pageNum] = page;
      let start = this.options.perPage * (pageNum - 1);
      let end = this.options.perPage * pageNum;
      this.lastDiscussions.splice(start, end - start, ...results);
      m.redraw();
      return;
    }

    this.getTotalPages = function () {
      return Math.ceil(this.totalDiscussionCount() / this.options.perPage);
    };

    this.page = Stream(page);
    this.perPage = Stream(this.options.perPage);
    this.totalPages = Stream(this.getTotalPages());

    this.ctrl = {
      prevPage: function () {
        let current = this.page().number;
        --current;

        if (current < 1) {
          return;
        }

        this.page(current);
        let next = current;
        this.loadingPrev = true;
        this.loadPage(next).then((results) => {
          this.parseResults(next, results);
          this.loadingPrev = false;
        });
      }.bind(this),

      nextPage: function () {
        let current = this.page().number;
        ++current;

        if (current > this.totalPages()) {
          current = this.totalPages();
          return;
        }

        this.page(current);
        let next = current;
        this.loadingNext = true;
        this.loadPage(next).then((results) => {
          this.parseResults(next, results);
          this.loadingNext = false;
        });
      }.bind(this),

      toPage: function (page) {
        if (this.page().number == Number(page) || page < 1 || page > this.totalPages()) return;

        this.page(Number(page));
        let next = Number(page);

        this.initialLoading = true;

        this.loadPage(next).then((results) => {
          this.parseResults(next, results);
          this.initialLoading = false;
        });
      }.bind(this),

      pageList: function () {
        let p = [],
          left = Math.max(parseInt(this.page().number) - this.options.leftEdges, 1),
          right = Math.min(parseInt(this.page().number) + this.options.rightEdges, this.totalPages());

        for (let i = left; i <= right; i++) {
          p.push(i);
        }

        return p;
      }.bind(this),
    };

    m.redraw();
  });

  override(DiscussionListState.prototype, 'addDiscussion', function (original) {
    // if (!this.usePaginationMode) {
    //   return original();
    // }
    // this.totalDiscussionCount(this.totalDiscussionCount() + 1);
    // this.totalPages(this.getTotalPages());
  });
}
