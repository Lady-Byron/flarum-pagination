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

import addUserPreference from './addUserPreference';
import determineMode from './determineMode';

app.initializers.add('foskym/flarum-pagination', () => {
  addUserPreference();

  override(DiscussionListState.prototype, 'refresh', function (original, page = 1) {
    this.options = {
      perPage: app.forum.attribute('foskym-pagination.perPage'),
      perLoadMore: app.forum.attribute('foskym-pagination.perLoadMore'),
      perIndexInit: app.forum.attribute('foskym-pagination.perIndexInit'),
      leftEdges: 4,
      rightEdges: 5,
    };

    this.usePaginationMode = determineMode();

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
      .finally(() => (this.initialLoading = false));
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
        this.loadPage(next).then(this.parseResults.bind(this, next));
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
        this.loadPage(next).then(this.parseResults.bind(this, next));
      }.bind(this),

      toPage: function (page) {
        if (this.page().number == Number(page) || page < 1 || page > this.totalPages()) return;

        this.page(Number(page));
        let next = Number(page);

        this.loadPage(next).then(this.parseResults.bind(this, next)); //.then(this.preLoadNextDiscussionPage(next + 1));
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

  extend(DiscussionList.prototype, 'view', function (view) {
    const state = this.attrs.state;

    if (!state.usePaginationMode) {
      return;
    }

    const params = state.getParams();

    let DiscussionListView;

    if (state.isEmpty()) {
      const text = app.translator.trans('core.forum.discussion_list.empty_text');
      DiscussionListView = Placeholder.component({ text });
      view.children = [];
      view.children.push(DiscussionListView);
      return;
    }

    if (!state.isLoading()) {
      let dicussionsOnPage = [];
      const pages = state.getPages();

      for (let index = 0; index < pages.length; index++) {
        const page = pages[index];
        if (page.number == state.location.page) {
          page.items.map((discussion) => {
            dicussionsOnPage.push(
              <li key={discussion.id()} data-id={discussion.id()}>
                {DiscussionListItem.component({ discussion, params })}
              </li>
            );
          });
          break;
        }
      }

      DiscussionListView = <ul className="DiscussionList-discussions">{dicussionsOnPage.map((i) => i)}</ul>;

      view.children = [];
      view.children.push(DiscussionListView);

      let buttonFirst = Button.component({
        title: 'First',
        icon: 'fa fa-angle-double-left',
        className: 'Button Button--icon',
        onclick: () => {
          state.ctrl.toPage(1);
        },
      });
      let buttonBack = Button.component({
        title: 'Back',
        icon: 'fa fa-angle-left',
        className: 'Button Button--icon',
        onclick: () => {
          let page = state.page().number;
          state.ctrl.toPage(parseInt(page) - 1);
        },
      });
      let buttonNext = Button.component({
        title: 'Next',
        icon: 'fa fa-angle-right',
        className: 'Button Button--icon',
        onclick: () => {
          let page = state.page().number;
          state.ctrl.toPage(parseInt(page) + 1);
        },
      });
      let buttonLast = Button.component({
        title: 'Last',
        icon: 'fa fa-angle-double-right',
        className: 'Button Button--icon',
        onclick: () => {
          let page = parseInt(state.totalPages());
          state.ctrl.toPage(parseInt(page));
        },
      });

      function JumpFunc() {
        let input = parseInt(document.getElementById('pagination-inputJump').value);
        if (Number.isFinite(input) && Number.isSafeInteger(input)) {
          if (input != state.page().number) {
            if (1 <= input && input <= state.totalPages()) {
              state.ctrl.toPage(input);
            }
          }
        }
      }
      let inputJump = m('input.FromControl', {
        id: 'pagination-inputJump',
        placeholder: state.page().number === undefined ? '' : `${state.page().number}`,
        onkeydown: (event) => {
          event.redraw = false;
          if (event.keyCode == 13) {
            event.redraw = true;
            JumpFunc();
          }
        },
      });
      let buttonJump = Button.component({
        title: 'Jump',
        icon: 'fas fa-paper-plane',
        className: 'Button Button--icon',
        onclick: JumpFunc,
      });

      let buttonPage = [];
      let buttons;
      let toolbar;

      state.ctrl.pageList().map(function (page) {
        let me = this;
        buttonPage.push(
          Button.component(
            {
              title: parseInt(page),
              icon: '',
              className: page == me.page().number ? 'Button Button--primary' : 'Button',
              'data-page': page,
              onclick:
                page != me.page().number
                  ? () => {
                      me.ctrl.toPage(parseInt(page));
                    }
                  : '',
            },
            m('strong', { className: '' }, parseInt(page))
          )
        );
      }, state);

      buttons = [buttonFirst].concat(buttonBack, buttonPage, buttonNext, buttonLast, inputJump, buttonJump);

      toolbar = {
        view: function (vnode) {
          return m(
            'div',
            { id: 'toolbar' + Math.floor(Math.random() * 10 + 1), className: 'Pagination' },
            m(
              'ul',
              { class: 'IndexPage-toolbar-view' },
              vnode.attrs.groupbuttons.map((ibutton) => {
                return m('li', { class: '' }, ibutton);
              })
            )
          );
        },
      };

      app.forum.attribute('foskym-pagination.paginationPosition') == 'above' && !state.isLoading()
        ? view.children.unshift(m(toolbar, { groupbuttons: buttons }))
        : '';
      app.forum.attribute('foskym-pagination.paginationPosition') == 'under' && !state.isLoading()
        ? view.children.push(m(toolbar, { groupbuttons: buttons }))
        : '';
      app.forum.attribute('foskym-pagination.paginationPosition') == 'both' && !state.isLoading()
        ? view.children.unshift(m(toolbar, { groupbuttons: buttons })) && view.children.push(m(toolbar, { groupbuttons: buttons }))
        : '';
    }
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
