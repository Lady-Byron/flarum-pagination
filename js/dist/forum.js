/******/ (() => { // webpackBootstrap
/******/ 	// runtime can't be in strict mode because a global variable is assign and maybe created.
/******/ 	var __webpack_modules__ = ({

/***/ "./src/forum/addUserPreference.js":
/*!****************************************!*\
  !*** ./src/forum/addUserPreference.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var flarum_forum_app__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! flarum/forum/app */ "flarum/forum/app");
/* harmony import */ var flarum_forum_app__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(flarum_forum_app__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var flarum_common_extend__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! flarum/common/extend */ "flarum/common/extend");
/* harmony import */ var flarum_common_extend__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(flarum_common_extend__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var flarum_forum_components_SettingsPage__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! flarum/forum/components/SettingsPage */ "flarum/forum/components/SettingsPage");
/* harmony import */ var flarum_forum_components_SettingsPage__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(flarum_forum_components_SettingsPage__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var flarum_common_components_FieldSet__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! flarum/common/components/FieldSet */ "flarum/common/components/FieldSet");
/* harmony import */ var flarum_common_components_FieldSet__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(flarum_common_components_FieldSet__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var flarum_common_utils_ItemList__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! flarum/common/utils/ItemList */ "flarum/common/utils/ItemList");
/* harmony import */ var flarum_common_utils_ItemList__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(flarum_common_utils_ItemList__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var flarum_common_components_Switch__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! flarum/common/components/Switch */ "flarum/common/components/Switch");
/* harmony import */ var flarum_common_components_Switch__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(flarum_common_components_Switch__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var flarum_common_utils_Stream__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! flarum/common/utils/Stream */ "flarum/common/utils/Stream");
/* harmony import */ var flarum_common_utils_Stream__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(flarum_common_utils_Stream__WEBPACK_IMPORTED_MODULE_6__);







/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  (0,flarum_common_extend__WEBPACK_IMPORTED_MODULE_1__.extend)((flarum_forum_components_SettingsPage__WEBPACK_IMPORTED_MODULE_2___default().prototype), 'oninit', function () {
    this.DLP_UserCustom = flarum_common_utils_Stream__WEBPACK_IMPORTED_MODULE_6___default()(this.user.preferences().DLP_UserCustom);
    this.DLP_UserPaginationFirst = flarum_common_utils_Stream__WEBPACK_IMPORTED_MODULE_6___default()(this.user.preferences().DLP_UserPaginationFirst);
  });
  (0,flarum_common_extend__WEBPACK_IMPORTED_MODULE_1__.extend)((flarum_forum_components_SettingsPage__WEBPACK_IMPORTED_MODULE_2___default().prototype), 'settingsItems', function (items) {
    if (Boolean(flarum_forum_app__WEBPACK_IMPORTED_MODULE_0___default().forum.attribute('LrysiaPagination.CanUserPref'))) {
      items.add('Lrysia_DLP_User', flarum_common_components_FieldSet__WEBPACK_IMPORTED_MODULE_3___default().component({
        label: flarum_forum_app__WEBPACK_IMPORTED_MODULE_0___default().translator.trans('Lrysia-DLP.forum.user.settings.Head'),
        className: 'Lrysia_DLP_PrefSettings'
      }, this.Lrysia_DLP_UserPrefItems().toArray()));
    }
  });
  (flarum_forum_components_SettingsPage__WEBPACK_IMPORTED_MODULE_2___default().prototype.Lrysia_DLP_UserPrefItems) = function () {
    var _this = this;
    var items = new (flarum_common_utils_ItemList__WEBPACK_IMPORTED_MODULE_4___default())();
    items.add('Lrysia_DLP_UserCustom', flarum_common_components_Switch__WEBPACK_IMPORTED_MODULE_5___default().component({
      state: this.user.preferences().DLP_UserCustom,
      onchange: function onchange(value) {
        _this.UserCustomLoading = true;
        _this.user.savePreferences({
          DLP_UserCustom: value
        }).then(function () {
          _this.UserCustomLoading = false;
          m.redraw();
        });
      },
      loading: this.UserCustomLoading
    }, flarum_forum_app__WEBPACK_IMPORTED_MODULE_0___default().translator.trans('Lrysia-DLP.forum.user.settings.DLP_UserCustom')));
    if (this.user.preferences().DLP_UserCustom) {
      items.add('Lrysia_DLP_UserPaginationFirst', flarum_common_components_Switch__WEBPACK_IMPORTED_MODULE_5___default().component({
        state: this.user.preferences().DLP_UserPaginationFirst,
        onchange: function onchange(value) {
          _this.UserPaginationFirstLoading = true;
          _this.user.savePreferences({
            DLP_UserPaginationFirst: value
          }).then(function () {
            _this.UserPaginationFirstLoading = false;
            m.redraw();
          });
        },
        loading: this.UserPaginationFirstLoading
      }, flarum_forum_app__WEBPACK_IMPORTED_MODULE_0___default().translator.trans('Lrysia-DLP.forum.user.settings.DLP_UserPaginationFirst')));
    }
    return items;
  };
}

/***/ }),

/***/ "./src/forum/determineMode.js":
/*!************************************!*\
  !*** ./src/forum/determineMode.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var flarum_forum_app__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! flarum/forum/app */ "flarum/forum/app");
/* harmony import */ var flarum_forum_app__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(flarum_forum_app__WEBPACK_IMPORTED_MODULE_0__);

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  if (Boolean(flarum_forum_app__WEBPACK_IMPORTED_MODULE_0___default().forum.attribute('LrysiaPagination.CanUserPref'))) {
    if (!Boolean(flarum_forum_app__WEBPACK_IMPORTED_MODULE_0___default().session.user.preferences().DLP_UserCustom)) {
      if (!Boolean(flarum_forum_app__WEBPACK_IMPORTED_MODULE_0___default().forum.attribute('LrysiaPagination.PaginationFirst'))) {
        return false;
      }
    } else {
      if (!Boolean(flarum_forum_app__WEBPACK_IMPORTED_MODULE_0___default().session.user.preferences().DLP_UserPaginationFirst)) {
        return false;
      }
    }
  } else {
    if (!Boolean(flarum_forum_app__WEBPACK_IMPORTED_MODULE_0___default().forum.attribute('LrysiaPagination.PaginationFirst'))) {
      return false;
    }
  }
  return true;
}

/***/ }),

/***/ "./src/forum/index.js":
/*!****************************!*\
  !*** ./src/forum/index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/esm/extends */ "./node_modules/@babel/runtime/helpers/esm/extends.js");
/* harmony import */ var flarum_extend__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! flarum/extend */ "flarum/extend");
/* harmony import */ var flarum_extend__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(flarum_extend__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var flarum_components_DiscussionList__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! flarum/components/DiscussionList */ "flarum/components/DiscussionList");
/* harmony import */ var flarum_components_DiscussionList__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(flarum_components_DiscussionList__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var flarum_states_DiscussionListState__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! flarum/states/DiscussionListState */ "flarum/states/DiscussionListState");
/* harmony import */ var flarum_states_DiscussionListState__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(flarum_states_DiscussionListState__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var flarum_components_DiscussionListItem__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! flarum/components/DiscussionListItem */ "flarum/components/DiscussionListItem");
/* harmony import */ var flarum_components_DiscussionListItem__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(flarum_components_DiscussionListItem__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var flarum_common_components_Placeholder__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! flarum/common/components/Placeholder */ "flarum/common/components/Placeholder");
/* harmony import */ var flarum_common_components_Placeholder__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(flarum_common_components_Placeholder__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var flarum_common_components_Button__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! flarum/common/components/Button */ "flarum/common/components/Button");
/* harmony import */ var flarum_common_components_Button__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(flarum_common_components_Button__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var flarum_common_utils_Stream__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! flarum/common/utils/Stream */ "flarum/common/utils/Stream");
/* harmony import */ var flarum_common_utils_Stream__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(flarum_common_utils_Stream__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var flarum_components_DiscussionComposer__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! flarum/components/DiscussionComposer */ "flarum/components/DiscussionComposer");
/* harmony import */ var flarum_components_DiscussionComposer__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(flarum_components_DiscussionComposer__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var flarum_utils_DiscussionControls__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! flarum/utils/DiscussionControls */ "flarum/utils/DiscussionControls");
/* harmony import */ var flarum_utils_DiscussionControls__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(flarum_utils_DiscussionControls__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var _addUserPreference__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./addUserPreference */ "./src/forum/addUserPreference.js");
/* harmony import */ var _determineMode__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./determineMode */ "./src/forum/determineMode.js");












app.initializers.add('lrysia/pagination', function () {
  // Add user preferences components
  (0,_addUserPreference__WEBPACK_IMPORTED_MODULE_10__["default"])();
  (0,flarum_extend__WEBPACK_IMPORTED_MODULE_1__.override)((flarum_states_DiscussionListState__WEBPACK_IMPORTED_MODULE_3___default().prototype), 'refresh', function (original) {
    var _this = this;
    // params set by lrysia/pagination
    this.options = {
      perPage: Number(app.forum.attribute('LrysiaPagination.PerPage')),
      perLoadMore: Number(app.forum.attribute('LrysiaPagination.PerLoadMore')),
      perIndexInit: Number(app.forum.attribute('LrysiaPagination.PerIndexInit')),
      leftEdges: 4,
      rightEdges: 5
    };

    // get the final loading mode
    this.usePaginationMode = (0,_determineMode__WEBPACK_IMPORTED_MODULE_11__["default"])();

    //
    if (!this.usePaginationMode) {
      this.pageSize = this.options.perLoadMore;
      return original(arguments[1]);
    }
    this.initialLoading = true;
    this.loadingPrev = false;
    this.loadingNext = false;

    // Modified by BlockCat
    var page = arguments[1] || 1;
    this.clear();

    //
    this.location = {
      page: page
    };
    return this.loadPage(page).then(function (results) {
      _this.pages = [];
      _this.parseResults(_this.location.page, results);
    })["finally"](function () {
      return _this.initialLoading = false;
    });
  });
  (0,flarum_extend__WEBPACK_IMPORTED_MODULE_1__.override)((flarum_states_DiscussionListState__WEBPACK_IMPORTED_MODULE_3___default().prototype), 'loadPage', function (original) {
    var page = arguments[1] === undefined ? 1 : arguments[1];
    var reqParams = this.requestParams();
    var include = Array.isArray(reqParams.include) ? reqParams.include.join(',') : reqParams.include;
    var newOffset, newLimit;
    if (this.usePaginationMode) {
      newOffset = this.options.perPage * (page - 1);
      newLimit = this.options.perPage;
    } else {
      newOffset = this.options.perIndexInit * Math.min(page - 1, 1) + this.options.perLoadMore * Math.max(page - 2, 0);
      newLimit = newOffset == 0 ? this.options.perIndexInit : this.options.perLoadMore;
    }
    var params = (0,_babel_runtime_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_0__["default"])({}, reqParams, {
      page: (0,_babel_runtime_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_0__["default"])({}, reqParams.page, {
        // request params(SQL-query) replaced by lrysia/pagination
        offset: newOffset,
        limit: newLimit
      }),
      include: include
    });
    return app.store.find(this.type, params);
  });
  (0,flarum_extend__WEBPACK_IMPORTED_MODULE_1__.override)((flarum_states_DiscussionListState__WEBPACK_IMPORTED_MODULE_3___default().prototype), 'parseResults', function (original) {
    var _arguments$2$payload;
    if (!this.usePaginationMode) {
      return original(arguments[1], arguments[2]);
    }

    // get page number from arguments of
    // parseResults(this, page, results)
    var pageNum = Number(arguments[1]);

    // get links from arguments of
    // parseResults(this, page, results)
    var links = ((_arguments$2$payload = arguments[2].payload) == null ? void 0 : _arguments$2$payload.links) || {};

    // create page by following structure
    var page = {
      number: pageNum,
      items: arguments[2],
      hasNext: !!(links != null && links.next),
      hasPrev: !!(links != null && links.prev)
    };

    // declare a function to check if
    // page already registred
    this.hasPage = function (page) {
      var allPages = this.getPages();
      if (allPages.length == 0) return false;
      for (var i = 0; i < allPages.length; i++) {
        if (allPages[i].number == page) return true;
      }
      return false;
    };

    // if page doesn't registred yet,
    // then page will added
    if (!this.hasPage(pageNum)) {
      this.pages.push(page);
    }

    // refresh current location
    this.location = {
      page: pageNum
    };

    // ATTENTION! THIS IS THE CORE OF lrysia/pagination(1.0.0)
    // Total number of discussions matching this SQL-query
    // (this interface is implemented by overriding the Flarum's backend source code)
    this.totalDiscussionCount = flarum_common_utils_Stream__WEBPACK_IMPORTED_MODULE_7___default()(arguments[2].payload.jsonapi.totalResultsCount);
    // If you want to know more details,
    // please look the PHP files in pagination/src and
    // the 'autoload' module in pagination/composer.json

    //
    this.getTotalPages = function () {
      return Math.ceil(this.totalDiscussionCount() / this.options.perPage);
    };

    //
    this.page = flarum_common_utils_Stream__WEBPACK_IMPORTED_MODULE_7___default()(page);
    this.perPage = flarum_common_utils_Stream__WEBPACK_IMPORTED_MODULE_7___default()(this.options.perPage);
    this.totalPages = flarum_common_utils_Stream__WEBPACK_IMPORTED_MODULE_7___default()(this.getTotalPages());

    // functions for pagination
    this.ctrl = {
      prevPage: function () {
        var current = this.page().number;
        --current;
        if (current < 1) {
          return; // do not load if at the begin
        }

        this.page(current);
        var next = current;
        this.loadPage(next).then(this.parseResults.bind(this, next));
      }.bind(this),
      nextPage: function () {
        var current = this.page().number;
        ++current;
        if (current > this.totalPages()) {
          current = this.totalPages(); // do not load if at the end
          return;
        }
        this.page(current);
        var next = current;
        this.loadPage(next).then(this.parseResults.bind(this, next));
      }.bind(this),
      toPage: function (page) {
        if (this.page().number == Number(page) || page < 1 || page > this.totalPages()) return;
        this.page(Number(page));
        var next = Number(page);
        this.loadPage(next).then(this.parseResults.bind(this, next)); //.then(this.preLoadNextDiscussionPage(next + 1));
      }.bind(this),
      pageList: function () {
        //
        var p = [],
          left = Math.max(parseInt(this.page().number) - this.options.leftEdges, 1),
          right = Math.min(parseInt(this.page().number) + this.options.rightEdges, this.totalPages());

        //
        for (var i = left; i <= right; i++) {
          p.push(i);
        }
        return p;
      }.bind(this)
    };
    m.redraw();
  });
  (0,flarum_extend__WEBPACK_IMPORTED_MODULE_1__.extend)((flarum_components_DiscussionList__WEBPACK_IMPORTED_MODULE_2___default().prototype), 'view', function (view) {
    // info about discussions
    var state = this.attrs.state;
    if (!state.usePaginationMode) {
      return;
    }
    var params = state.getParams();

    //
    var DiscussionListView;

    //
    if (state.isEmpty()) {
      var text = app.translator.trans('core.forum.discussion_list.empty_text');
      DiscussionListView = flarum_common_components_Placeholder__WEBPACK_IMPORTED_MODULE_5___default().component({
        text: text
      });
      view.children = [];
      view.children.push(DiscussionListView);
      return;
    }

    //
    if (!state.isLoading()) {
      //
      var JumpFunc = function JumpFunc() {
        var input = parseInt(document.getElementById('lrysia-inputJump').value);
        // 跳转前检查页码合法性
        if (Number.isFinite(input) && Number.isSafeInteger(input)) {
          if (input != state.page().number) {
            if (1 <= input && input <= state.totalPages()) {
              state.ctrl.toPage(input);
            }
          }
        }
      };
      var dicussionsOnPage = [];
      var pages = state.getPages();

      //
      for (var index = 0; index < pages.length; index++) {
        var page = pages[index];
        if (page.number == state.location.page) {
          page.items.map(function (discussion) {
            dicussionsOnPage.push(m("li", {
              key: discussion.id(),
              "data-id": discussion.id()
            }, flarum_components_DiscussionListItem__WEBPACK_IMPORTED_MODULE_4___default().component({
              discussion: discussion,
              params: params
            })));
          });
          break;
        }
      }

      //
      DiscussionListView = m("ul", {
        className: "DiscussionList-discussions"
      }, dicussionsOnPage.map(function (i) {
        return i;
      }));

      //
      view.children = [];
      view.children.push(DiscussionListView);

      // define buttons
      var buttonFirst = flarum_common_components_Button__WEBPACK_IMPORTED_MODULE_6___default().component({
        title: "First",
        icon: 'fa fa-angle-double-left',
        className: 'Button Button--icon',
        onclick: function onclick() {
          state.ctrl.toPage(1);
        }
      });
      var buttonBack = flarum_common_components_Button__WEBPACK_IMPORTED_MODULE_6___default().component({
        title: "Back",
        icon: 'fa fa-angle-left',
        className: 'Button Button--icon',
        onclick: function onclick() {
          var page = state.page().number;
          state.ctrl.toPage(parseInt(page) - 1);
        }
      });
      var buttonNext = flarum_common_components_Button__WEBPACK_IMPORTED_MODULE_6___default().component({
        title: "Next",
        icon: 'fa fa-angle-right',
        className: 'Button Button--icon',
        onclick: function onclick() {
          var page = state.page().number;
          state.ctrl.toPage(parseInt(page) + 1);
        }
      });
      var buttonLast = flarum_common_components_Button__WEBPACK_IMPORTED_MODULE_6___default().component({
        title: "Last",
        icon: 'fa fa-angle-double-right',
        className: 'Button Button--icon',
        onclick: function onclick() {
          var page = parseInt(state.totalPages());
          state.ctrl.toPage(parseInt(page));
        }
      });
      var inputJump = m('input.FromControl', {
        id: 'lrysia-inputJump',
        placeholder: state.page().number === undefined ? '' : "" + state.page().number,
        onkeydown: function onkeydown(event) {
          event.redraw = false;
          if (event.keyCode == 13) {
            event.redraw = true;
            JumpFunc();
          }
        }
      });
      var buttonJump = flarum_common_components_Button__WEBPACK_IMPORTED_MODULE_6___default().component({
        title: "Jump",
        icon: 'fas fa-paper-plane',
        className: 'Button Button--icon',
        onclick: JumpFunc
      });

      //
      var buttonPage = [];
      var buttons;
      var toolbar;

      //
      state.ctrl.pageList().map(function (page) {
        var me = this;
        buttonPage.push(flarum_common_components_Button__WEBPACK_IMPORTED_MODULE_6___default().component({
          title: parseInt(page),
          icon: '',
          className: page == me.page().number ? 'Button Button--primary' : 'Button',
          'data-page': page,
          onclick: page != me.page().number ? function () {
            me.ctrl.toPage(parseInt(page));
          } : ''
        }, m('strong', {
          className: ''
        }, parseInt(page))));
      }, state);

      //
      buttons = [buttonFirst].concat(buttonBack, buttonPage, buttonNext, buttonLast, inputJump, buttonJump);

      //
      toolbar = {
        view: function view(vnode) {
          return m('div', {
            id: 'toolbar' + Math.floor(Math.random() * 10 + 1),
            className: 'Pagination'
          }, m('ul', {
            "class": 'IndexPage-toolbar-view'
          }, vnode.attrs.groupbuttons.map(function (ibutton) {
            return m('li', {
              "class": ''
            }, ibutton);
          })));
        }
      };

      //
      app.forum.attribute('LrysiaPagination.NavBarPosition') == 'above' && !state.isLoading() ? view.children.unshift(m(toolbar, {
        groupbuttons: buttons
      })) : '';
      app.forum.attribute('LrysiaPagination.NavBarPosition') == 'under' && !state.isLoading() ? view.children.push(m(toolbar, {
        groupbuttons: buttons
      })) : '';
      app.forum.attribute('LrysiaPagination.NavBarPosition') == 'both' && !state.isLoading() ? view.children.unshift(m(toolbar, {
        groupbuttons: buttons
      })) && view.children.push(m(toolbar, {
        groupbuttons: buttons
      })) : '';
    }
  });

  // clear
  (0,flarum_extend__WEBPACK_IMPORTED_MODULE_1__.extend)((flarum_utils_DiscussionControls__WEBPACK_IMPORTED_MODULE_9___default()), 'deleteAction', function () {
    if (!this.usePaginationMode) {
      return;
    }
    if (app.discussions) {
      var page = app.discussions.location.page;
      app.discussions.refresh(page);
    }
  });
  (0,flarum_extend__WEBPACK_IMPORTED_MODULE_1__.extend)((flarum_components_DiscussionComposer__WEBPACK_IMPORTED_MODULE_8___default().prototype), 'onsubmit', function () {
    if (!this.usePaginationMode) {
      return;
    }
    if (app.discussions) {
      // let page = app.discussions.location.page;
      app.discussions.refresh();
    }
  });
});

/***/ }),

/***/ "flarum/common/components/Button":
/*!*****************************************************************!*\
  !*** external "flarum.core.compat['common/components/Button']" ***!
  \*****************************************************************/
/***/ ((module) => {

"use strict";
module.exports = flarum.core.compat['common/components/Button'];

/***/ }),

/***/ "flarum/common/components/FieldSet":
/*!*******************************************************************!*\
  !*** external "flarum.core.compat['common/components/FieldSet']" ***!
  \*******************************************************************/
/***/ ((module) => {

"use strict";
module.exports = flarum.core.compat['common/components/FieldSet'];

/***/ }),

/***/ "flarum/common/components/Placeholder":
/*!**********************************************************************!*\
  !*** external "flarum.core.compat['common/components/Placeholder']" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = flarum.core.compat['common/components/Placeholder'];

/***/ }),

/***/ "flarum/common/components/Switch":
/*!*****************************************************************!*\
  !*** external "flarum.core.compat['common/components/Switch']" ***!
  \*****************************************************************/
/***/ ((module) => {

"use strict";
module.exports = flarum.core.compat['common/components/Switch'];

/***/ }),

/***/ "flarum/common/extend":
/*!******************************************************!*\
  !*** external "flarum.core.compat['common/extend']" ***!
  \******************************************************/
/***/ ((module) => {

"use strict";
module.exports = flarum.core.compat['common/extend'];

/***/ }),

/***/ "flarum/common/utils/ItemList":
/*!**************************************************************!*\
  !*** external "flarum.core.compat['common/utils/ItemList']" ***!
  \**************************************************************/
/***/ ((module) => {

"use strict";
module.exports = flarum.core.compat['common/utils/ItemList'];

/***/ }),

/***/ "flarum/common/utils/Stream":
/*!************************************************************!*\
  !*** external "flarum.core.compat['common/utils/Stream']" ***!
  \************************************************************/
/***/ ((module) => {

"use strict";
module.exports = flarum.core.compat['common/utils/Stream'];

/***/ }),

/***/ "flarum/components/DiscussionComposer":
/*!**********************************************************************!*\
  !*** external "flarum.core.compat['components/DiscussionComposer']" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = flarum.core.compat['components/DiscussionComposer'];

/***/ }),

/***/ "flarum/components/DiscussionList":
/*!******************************************************************!*\
  !*** external "flarum.core.compat['components/DiscussionList']" ***!
  \******************************************************************/
/***/ ((module) => {

"use strict";
module.exports = flarum.core.compat['components/DiscussionList'];

/***/ }),

/***/ "flarum/components/DiscussionListItem":
/*!**********************************************************************!*\
  !*** external "flarum.core.compat['components/DiscussionListItem']" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = flarum.core.compat['components/DiscussionListItem'];

/***/ }),

/***/ "flarum/extend":
/*!***********************************************!*\
  !*** external "flarum.core.compat['extend']" ***!
  \***********************************************/
/***/ ((module) => {

"use strict";
module.exports = flarum.core.compat['extend'];

/***/ }),

/***/ "flarum/forum/app":
/*!**************************************************!*\
  !*** external "flarum.core.compat['forum/app']" ***!
  \**************************************************/
/***/ ((module) => {

"use strict";
module.exports = flarum.core.compat['forum/app'];

/***/ }),

/***/ "flarum/forum/components/SettingsPage":
/*!**********************************************************************!*\
  !*** external "flarum.core.compat['forum/components/SettingsPage']" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = flarum.core.compat['forum/components/SettingsPage'];

/***/ }),

/***/ "flarum/states/DiscussionListState":
/*!*******************************************************************!*\
  !*** external "flarum.core.compat['states/DiscussionListState']" ***!
  \*******************************************************************/
/***/ ((module) => {

"use strict";
module.exports = flarum.core.compat['states/DiscussionListState'];

/***/ }),

/***/ "flarum/utils/DiscussionControls":
/*!*****************************************************************!*\
  !*** external "flarum.core.compat['utils/DiscussionControls']" ***!
  \*****************************************************************/
/***/ ((module) => {

"use strict";
module.exports = flarum.core.compat['utils/DiscussionControls'];

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/esm/extends.js":
/*!************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/esm/extends.js ***!
  \************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _extends)
/* harmony export */ });
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!******************!*\
  !*** ./forum.js ***!
  \******************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _src_forum__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./src/forum */ "./src/forum/index.js");

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=forum.js.map