import app from 'flarum/common/app';
import { extend, override } from 'flarum/extend';
import DiscussionList from 'flarum/forum/components/DiscussionList';
import DiscussionListState from 'flarum/forum/states/DiscussionListState';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import Placeholder from 'flarum/common/components/Placeholder';
import Button from 'flarum/common/components/Button';
import Stream from 'flarum/common/utils/Stream';
import DiscussionComposer from 'flarum/forum/components/DiscussionComposer';
import DiscussionControls from 'flarum/forum/utils/DiscussionControls';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import classList from 'flarum/common/utils/classList';

import addUserPreference from './addUserPreference';
import determineMode from './determineMode';
import Toolbar from './components/Toolbar';

app.initializers.add('foskym/flarum-pagination', () => {
  addUserPreference();

  DiscussionListState.prototype.initOptions = function () {
    this.options = {
      perPage: app.forum.attribute('foskym-pagination.perPage'),
      perLoadMore: app.forum.attribute('foskym-pagination.perLoadMore'),
      perIndexInit: app.forum.attribute('foskym-pagination.perIndexInit'),
      leftEdges: 4,
      rightEdges: 5,
    };

    this.usePaginationMode = determineMode();
  };

  override(DiscussionListState.prototype, 'refresh', function (original, page = 1) {
    this.initOptions();

    if (!this.usePaginationMode) {
      this.pageSize = this.options.perLoadMore;
      return original(page);
    }

    this.initialLoading = true;
    this.loadingPrev = false;
    this.loadingNext = false;

    this.clear();

    this.location = { page };

    return this.loadPage(page)
      .then((results) => {
        this.pages = [];
        this.parseResults(this.location.page, results);
      })
      .finally(() => {
        this.initialLoading = false;
      });
  });

  override(DiscussionListState.prototype, 'loadPage', function (original, page = 1) {
    const reqParams = this.requestParams();

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

  override(DiscussionList.prototype, 'view', function (original) {
    const state = this.attrs.state;

    if (!state.usePaginationMode) {
      return original();
    }

    const params = state.getParams();
    const isLoading = state.isLoading();

    if (state.isEmpty()) {
      const text = app.translator.trans('core.forum.discussion_list.empty_text');
      return (
        <div className="DiscussionList">
          <Placeholder text={text} />
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className={classList('DiscussionList', { 'DiscussionList--searchResults': state.isSearchResults() })}>
          <ul role="feed" aria-busy={isLoading} className="DiscussionList-discussions"></ul>
          <div className="DiscussionList-loadMore">
            <LoadingIndicator />
          </div>
        </div>
      );
    }

    const pages = state.getPages();
    let items = [];

    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      if (page.number == state.location.page) {
        items = page.items;
        break;
      }
    }

    const controls = Toolbar.component({ state });
    const position = app.forum.attribute('foskym-pagination.paginationPosition');
    const pageSize = state.options.perPage;
    const pageNum = state.page;

    return (
      <div className={classList('DiscussionList', { 'DiscussionList--searchResults': state.isSearchResults() })}>
        {position == 'above' || position == 'both' ? controls : ''}
        <ul role="feed" aria-busy={isLoading} className="DiscussionList-discussions">
          {items.map((discussion, itemNum) => (
            <li key={discussion.id()} data-id={discussion.id()} role="article" aria-setsize="-1" aria-posinset={pageNum * pageSize + itemNum}>
              <DiscussionListItem discussion={discussion} params={params} />
            </li>
          ))}
        </ul>
        {position == 'under' || position == 'both' ? controls : ''}
      </div>
    );
  });

  extend(DiscussionControls, 'deleteAction', function () {
    if (!this.usePaginationMode) {
      return;
    }

    if (app.discussions) {
      let page = app.discussions.location.page;
      app.discussions.refresh(page);
    }
  });

  extend(DiscussionComposer.prototype, 'onsubmit', function () {
    if (!this.usePaginationMode) {
      return;
    }

    if (app.discussions) {
      // let page = app.discussions.location.page;
      app.discussions.refresh();
    }
  });
});
