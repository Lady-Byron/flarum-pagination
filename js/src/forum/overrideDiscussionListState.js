import app from 'flarum/common/app';
import { override } from 'flarum/common/extend';
import DiscussionListState from 'flarum/forum/states/DiscussionListState';
import Stream from 'flarum/common/utils/Stream';
import determineMode from './utils/determineMode';

/* -------------------- 路由/URL 工具 -------------------- */
function getPageFromURL() {
  try {
    const p = new URL(window.location.href).searchParams.get('page');
    const n = parseInt(p, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch { return null; }
}
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
function routeKey() {
  try {
    const mAny = (window && window.m) || null;
    if (mAny?.route?.get) return String(mAny.route.get());
  } catch {}
  return location.pathname + location.search + (location.hash || '');
}

/* -------- “从帖子返回”标记：每次回退都当作首次挂载 -------- */
const PENDING_BACK_KEY = 'lbtc:dl:pendingBack';
if (!window.__dlBackMarkerInstalled) {
  window.__dlBackMarkerInstalled = true;
  document.addEventListener('click', (ev) => {
    const target = ev.target;
    const a = target && (target.closest?.('a[href*="/d/"]'));
    if (a) {
      try {
        sessionStorage.setItem(PENDING_BACK_KEY, JSON.stringify({ t: Date.now(), base: routeKey() }));
      } catch {}
      // 离开前保存锚点（见下）
      saveAnchorBeforeLeave();
    }
  }, { capture: true, passive: true });
}
function consumePendingBackForCurrentRoute() {
  try {
    const raw = sessionStorage.getItem(PENDING_BACK_KEY);
    if (!raw) return false;
    const obj = JSON.parse(raw);
    const ok = obj && obj.base === routeKey() && Date.now() - (obj.t || 0) < 10 * 60 * 1000;
    if (ok) sessionStorage.removeItem(PENDING_BACK_KEY);
    return !!ok;
  } catch { return false; }
}

/* -------------------- 锚点保存/恢复（用于“不滚回”） -------------------- */
const ANCHOR_KEY_PREFIX = 'lbtc:dl:anchor:';
function headerOffsetGuess() {
  const el = document.querySelector('.App-header, .Header, #header, header');
  return el ? Math.max(0, el.getBoundingClientRect().height - 4) : 0;
}
function anchorStorageKey() {
  return ANCHOR_KEY_PREFIX + (location.pathname + location.search + (location.hash || ''));
}
function saveAnchorBeforeLeave() {
  try {
    const items = Array.from(document.querySelectorAll('li.DiscussionListItem'));
    const topEdge = headerOffsetGuess();
    let topEl = null, minTop = Infinity;

    for (const li of items) {
      const r = li.getBoundingClientRect();
      if (r.bottom <= topEdge) continue;
      if (r.top >= topEdge && r.top < minTop) { topEl = li; minTop = r.top; }
    }

    let id, href, y = window.scrollY || document.documentElement.scrollTop || 0;
    if (topEl) {
      id = topEl.getAttribute('data-id') || undefined;
      const a = topEl.querySelector('a[href*="/d/"]'); href = a?.getAttribute('href') || undefined;
    }
    sessionStorage.setItem(anchorStorageKey(), JSON.stringify({ id, href, y, t: Date.now() }));
  } catch {}
}
function parseAnchor() {
  try {
    const raw = sessionStorage.getItem(anchorStorageKey());
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object') return null;
    return s;
  } catch { return null; }
}
function findTargetElementByAnchor(anchor) {
  if (!anchor) return null;
  if (anchor.id) {
    const el = document.querySelector(`li.DiscussionListItem[data-id="${anchor.id}"]`);
    if (el) return el;
  }
  if (anchor.href) {
    const m = anchor.href.match(/\/d\/(\d+)/);
    if (m) {
      const el = document.querySelector(`li.DiscussionListItem a[href*="/d/${m[1]}"]`)?.closest('li.DiscussionListItem');
      if (el) return el;
    }
  }
  return null;
}
function restoreScrollFromAnchor(anchor) {
  if (!anchor) return;
  const offset = headerOffsetGuess();
  const targetEl = findTargetElementByAnchor(anchor);
  if (targetEl) {
    const y = window.scrollY + targetEl.getBoundingClientRect().top - offset - 8;
    requestAnimationFrame(() => window.scrollTo(0, Math.max(0, y)));
    return;
  }
  if (typeof anchor.y === 'number') {
    let tries = 0;
    const max = 40;
    const tick = () => {
      const h = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
      if (h > anchor.y + 50 || tries >= max) {
        requestAnimationFrame(() => window.scrollTo(0, Math.max(0, anchor.y - Math.max(0, offset))));
      } else { tries++; setTimeout(tick, 50); }
    };
    tick();
  }
}
// 暴露给视图层（用于 oncreate 中“瞬移到锚点”）
window.__dlRestoreFromAnchor = restoreScrollFromAnchor;

/* -------------------- 会话级页面缓存（回退直出） -------------------- */
function buildSessionKey(state, page) {
  try {
    const req = state.requestParams ? state.requestParams() : {};
    const base = location.pathname;
    const keyObj = {
      base,
      include: req.include || [],
      filter: req.filter || {},
      sort: req.sort || null,
      perPage: state.options?.perPage || 20,
      page: Number(page) || 1,
    };
    return 'lbtc:dl:pagecache:' + JSON.stringify(keyObj);
  } catch { return null; }
}
function savePageCache(state, page, results) {
  try {
    const key = buildSessionKey(state, page);
    if (!key) return;
    const ids = Array.isArray(results) ? results.map((d) => d && d.id && d.id()) : [];
    const total =
      (state.totalDiscussionCount && state.totalDiscussionCount()) ||
      (results && results.payload && results.payload.jsonapi && results.payload.jsonapi.totalResultsCount) ||
      0;
    const record = { ids, total, ts: Date.now(), perPage: state.options?.perPage || 20 };
    sessionStorage.setItem(key, JSON.stringify(record));
  } catch {}
}
function tryRestoreFromSession(state, page) {
  try {
    const key = buildSessionKey(state, page);
    if (!key) return null;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;

    const rec = JSON.parse(raw);
    if (!rec || !Array.isArray(rec.ids) || !rec.ids.length) return null;

    const type = state.type || 'discussions';
    const models = [];
    for (const id of rec.ids) {
      const model =
        (app.store.getById && app.store.getById(type, id)) ||
        (app.store.getBy && app.store.getBy(type, 'id', id)) ||
        null;
      if (!model) return null; // 缺任一条则放弃会话恢复
      models.push(model);
    }

    const totalPages = Math.ceil((rec.total || 0) / (rec.perPage || state.options?.perPage || 20));
    const links = {};
    if (page > 1) links.prev = true;
    if (page < totalPages) links.next = true;

    const results = models;
    results.payload = { jsonapi: { totalResultsCount: rec.total || 0 }, links };
    return results;
  } catch { return null; }
}
function invalidateSessionPage(state, page) {
  try {
    const key = buildSessionKey(state, page);
    if (key) sessionStorage.removeItem(key);
  } catch {}
}

/* -------------------- 主逻辑 -------------------- */
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

    // 第一次 refreshParams 标记（用于区分冷启动/回退 vs 后续黄条）
    this.__paramsRefreshedOnce = false;
  };

  /**
   * 参数刷新：
   * - 若检测到“从帖子返回”的标记 → 当作首次挂载处理：尊重 URL ?page，不绕过会话缓存（静默直出）
   * - 否则：
   *   - 第一次触发：同上（兼容冷启动/直接访问）
   *   - 后续触发（黄条、切换排序/筛选）：回到第1页，绕过一次会话缓存（强制网络）
   */
  override(DiscussionListState.prototype, 'refreshParams', function (original, params, page = 1) {
    const ret = original(params, page);
    if (!this.usePaginationMode || typeof this.refresh !== 'function') return ret;

    const back = consumePendingBackForCurrentRoute();
    const first = !this.__paramsRefreshedOnce;

    if (back || first) {
      this.__paramsRefreshedOnce = true;
      const goPage = getPageFromURL() ?? (page ?? 1);
      return Promise.resolve(ret).then(() => this.refresh(goPage));
    }

    // 黄条/后续：强制到第1页 + 绕过一次会话缓存
    const goPage = 1;
    this.__bypassSessionOnce = true;
    invalidateSessionPage(this, goPage);
    return Promise.resolve(ret).then(() => this.refresh(goPage));
  });

  // 刷新指定页（含：会话缓存直出 + 首帧静默 + URL 同步；支持一次性绕过）
  override(DiscussionListState.prototype, 'refresh', function (original, page = 1) {
    if (!this.optionInitialized) this.initOptions();

    if (!this.usePaginationMode) {
      this.pageSize = this.options.perLoadMore;
      return original(page);
    }

    let targetPage = page;
    if (targetPage === undefined || targetPage === 1) {
      const u = getPageFromURL();
      if (u) targetPage = u;
    }

    // 会话缓存直出（不发请求）——但允许被一次性绕过
    if (!this.__bypassSessionOnce) {
      const sessionResults = tryRestoreFromSession(this, targetPage);
      if (sessionResults) {
        this.silentRestoreOnce = true; // 首帧去 Loading

        this.initialLoading = false;
        this.loadingPrev = false;
        this.loadingNext = false;
        this.isRefreshing = false;

        this.location = { page: targetPage };
        setPageToURL(targetPage, true);

        this.pages = [];
        this.parseResults(this.location.page, sessionResults);

        if (typeof m !== 'undefined' && m.redraw) m.redraw();

        // ★ 为“看起来不滚回”：交给视图隐藏首帧并瞬移到锚点
        const anchor = parseAnchor();
        if (anchor) {
          this.__pendingAnchor = anchor;
          this.__hideListOnce = true;
        }

        setTimeout(() => (this.silentRestoreOnce = false), 0);
        return Promise.resolve(sessionResults);
      }
    }
    // 用完即清
    this.__bypassSessionOnce = false;

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
          if (typeof m !== 'undefined' && m.redraw) m.redraw();
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
      page: { ...reqParams.page, offset: newOffset, limit: newLimit },
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

  // 解析结果并更新分页状态（保存会话缓存）
  override(DiscussionListState.prototype, 'parseResults', function (original, pg, results) {
    if (!this.usePaginationMode) return original(pg, results);

    const pageNum = Number(pg);
    const links = results.payload?.links || {};
    const page = { number: pageNum, items: results, hasNext: !!links?.next, hasPrev: !!links?.prev };

    this.hasPage = function (num) {
      const all = this.getPages(true);
      if (all.length === 0) return false;
      return all.some((p) => p.number === num);
    };

    if (!this.hasPage(pageNum)) this.pages.push(page);
    this.pages = this.pages.sort((a, b) => a.number - b.number);
    this.location = { page: pageNum };

    this.totalDiscussionCount = Stream(results.payload.jsonapi.totalResultsCount);

    if (this.options.cacheDiscussions) {
      if (
        (this.lastTotalDiscussionCount !== this.totalDiscussionCount() && this.lastTotalDiscussionCount !== 0) ||
        this.lastTotalDiscussionCount === 0 ||
        this.isRefreshing
      ) {
        this.lastTotalDiscussionCount = this.totalDiscussionCount();
        this.lastDiscussions = new Array(this.lastTotalDiscussionCount);
        this.lastLoadedPage = {};
      } else {
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

    // 保存本页到会话缓存（供回退直出）
    savePageCache(this, pageNum, results);

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

    if (typeof m !== 'undefined' && m.redraw) m.redraw();
  });

  // Realtime：倒计时结束 → 刷新第 1 页，但绕过一次会话缓存，确保拉到最新数据
  override(DiscussionListState.prototype, 'addDiscussion', function (original, discussion) {
    if (!this.usePaginationMode) return original(discussion);

    clearTimeout(this.__rtRefreshTimer);
    this.__rtRefreshTimer = setTimeout(() => {
      this.page = this.page || Stream({ number: 1, items: [] });
      this.location = { page: 1 };
      this.__bypassSessionOnce = true;
      invalidateSessionPage(this, 1);
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
    if (typeof m !== 'undefined' && m.redraw) m.redraw();
  });

  override(DiscussionListState.prototype, 'deleteDiscussion', function (original, discussion) {
    if (!this.usePaginationMode) return original(discussion);
    const index = this.lastDiscussions.indexOf(discussion);
    if (index !== -1) {
      this.lastDiscussions.splice(index);
      this.lastTotalDiscussionCount--;
      this.totalDiscussionCount(this.lastTotalDiscussionCount);
    }
    if (typeof m !== 'undefined' && m.redraw) m.redraw();
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
