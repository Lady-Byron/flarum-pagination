import app from 'flarum/common/app';
import { override } from 'flarum/common/extend';
import DiscussionListState from 'flarum/forum/states/DiscussionListState';
import Stream from 'flarum/common/utils/Stream';

import determineMode from './utils/determineMode';

export default function () {
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

    if (!this.isRefreshing && this.options.cacheDiscussions) {
      if (
        JSON.stringify(reqParams['include']) !== JSON.stringify(this.lastRequestParams['include']) ||
        JSON.stringify(reqParams['filter']) !== JSON.stringify(this.lastRequestParams['filter.q']) ||
        reqParams['sort'] !== this.lastRequestParams['sort']
      ) {
        if (this.lastLoadedPage[page]) {
          let start = this.options.perPage * (page - 1);
          let end = this.options.perPage * page;
          let results = this.lastDiscussions.slice(start, end);
          results.payload = { jsonapi: { totalResultsCount: this.totalDiscussionCount() } };

          // for `walsgit/flarum-discussion-cards`
          // if resolve at first, the card items would not redraw at `cache mode`.
          this.initialLoading = true;
          m.redraw();
          return new Promise((resolve) => setTimeout(() => resolve(results), 50));

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


  // for `walsgit-discussion-cards`, might cause other extensions error?
  override(DiscussionListState.prototype, 'getAllItems', function(original) {
    if (!'walsgit-discussion-cards' in flarum.extensions) return original();

    return this.extraDiscussions.concat(
      this.getPages(true)
        .map((pg) => pg.items)
        .flat()
    );
  })

  // for `walsgit-discussion-cards`, might cause other extensions error?
  override(DiscussionListState.prototype, 'getPages', function(original, getAllPages = false) {
    const allPages = original();
    if (!'walsgit-discussion-cards' in flarum.extensions) return allPages;

    if (getAllPages) return allPages;
    return [allPages.find((page) => page.number === this.location.page)]
  })

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
      let allPages = this.getPages(true);
      if (allPages.length == 0) return false;
      for (let i = 0; i < allPages.length; i++) {
        if (allPages[i].number == page) return true;
      }
      return false;
    };

    if (!this.hasPage(pageNum)) {
      this.pages.push(page);
    }

    this.pages = this.pages.sort((a, b) => a.number - b.number)

    this.location = { page: pageNum };

    this.totalDiscussionCount = Stream(results.payload.jsonapi.totalResultsCount);

    if (this.options.cacheDiscussions) {
      if (
        (this.lastTotalDiscussionCount != this.totalDiscussionCount() && this.lastTotalDiscussionCount != 0) ||
        this.lastTotalDiscussionCount === 0 ||
        this.isRefreshing
      ) {
        // need to update the discussion list
        this.lastTotalDiscussionCount = this.totalDiscussionCount();
        for (let i = 0; i < this.lastTotalDiscussionCount; i++) {
          this.lastDiscussions[i] = {};
        }
        this.lastLoadedPage = {};
      } else {
        // no need to update the discussion list
        this.lastLoadedPage[pageNum] = page;
        let start = this.options.perPage * (pageNum - 1);
        let end = this.options.perPage * pageNum;
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

  override(DiscussionListState.prototype, 'addDiscussion', function (original, discussion) {
    if (!this.usePaginationMode) {
      return original();
    }
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
    if (!this.usePaginationMode) {
      return original();
    }
    const index = this.lastDiscussions.indexOf(discussion);

    if (index !== -1) {
      this.lastDiscussions.splice(index);
      this.lastTotalDiscussionCount--;
      this.totalDiscussionCount(this.lastTotalDiscussionCount);
    }

    m.redraw();
  });

  override(DiscussionListState.prototype, 'clear', function (original) {
    if (!this.usePaginationMode) {
      return original();
    }
    this.lastDiscussions = [];
    this.lastLoadedPage = {};
    this.lastRequestParams = {};
    this.lastTotalDiscussionCount = 0;
    this.lastTotalPages = 0;
    this.totalDiscussionCount = Stream(0);
    return original();
  });
}
