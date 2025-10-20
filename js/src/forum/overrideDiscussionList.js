import app from 'flarum/common/app';
import { override } from 'flarum/common/extend';
import DiscussionList from 'flarum/forum/components/DiscussionList';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import classList from 'flarum/common/utils/classList';
import Toolbar from './components/Toolbar';

/**
 * 要点：
 * - 绝不新建第二个 <ul.DiscussionList-discussions>，只原位替换其 children。
 * - 删除其它空壳 UL；Toolbar 作为兄弟节点插入（上/下）。
 * - cards 模式不触碰 UL，只插 Toolbar。
 * - 静默恢复：当 state.silentRestoreOnce 为真时，去掉本帧的 LoadingIndicator。
 * - “不滚回”的视觉：state.__hideListOnce 为真时，本帧隐藏列表；
 *   oncreate 同帧用锚点瞬移到目标帖子，再显示列表。
 */
export default function () {
  override(DiscussionList.prototype, 'view', function (original) {
    const state = this.attrs?.state;
    const tree = original();

    // 根节点类
    tree.attrs = tree.attrs || {};
    tree.attrs.className = classList(
      'DiscussionList',
      { 'DiscussionList--searchResults': state?.isSearchResults?.() },
      tree.attrs.className
    );

    // 静默恢复：移除本帧 LoadingIndicator
    if (state?.silentRestoreOnce) {
      const getClass = (attrs) => String((attrs && (attrs.className || attrs.class)) || '');
      const isLoadingIndicator = (n) => n && typeof n === 'object' && n.attrs && getClass(n.attrs).includes('LoadingIndicator');
      const childrenRef = (nodeOrArr) => {
        if (Array.isArray(nodeOrArr)) return nodeOrArr;
        if (nodeOrArr && Array.isArray(nodeOrArr.children)) return nodeOrArr.children;
        return null;
      };
      (function strip(node) {
        if (!node) return;
        if (Array.isArray(node)) {
          for (let i = node.length - 1; i >= 0; i--) {
            const child = node[i];
            if (isLoadingIndicator(child)) node.splice(i, 1);
            else strip(child);
          }
          return;
        }
        if (typeof node === 'string' || typeof node === 'number') return;
        const ch = childrenRef(node);
        if (!ch) return;
        for (let i = ch.length - 1; i >= 0; i--) {
          const c = ch[i];
          if (isLoadingIndicator(c)) ch.splice(i, 1);
          else strip(c);
        }
      })(tree);
    }

    // ★ 不滚回：首帧隐藏 + oncreate 瞬移锚点后再显示
    if (state?.__hideListOnce) {
      const oldStyle = tree.attrs.style || '';
      tree.attrs.style = (oldStyle ? oldStyle + ';' : '') + 'visibility:hidden';

      const prevOncreate = tree.attrs.oncreate;
      tree.attrs.oncreate = function (vnode) {
        if (typeof prevOncreate === 'function') prevOncreate.call(this, vnode);
        try {
          if (window.__dlRestoreFromAnchor && state.__pendingAnchor) {
            const docEl = document.documentElement;
            const prev = docEl.style.scrollBehavior;
            docEl.style.scrollBehavior = 'auto'; // 关闭平滑滚动，确保无“滚动感”
            window.__dlRestoreFromAnchor(state.__pendingAnchor);
            docEl.style.scrollBehavior = prev || '';
          }
        } catch {}
        // 清理一次性标记并恢复可见
        state.__pendingAnchor = null;
        state.__hideListOnce = false;
        // 下一帧显示
        if (typeof m !== 'undefined' && m.redraw) m.redraw();
      };
    }

    // 非分页模式/加载中/空列表：不改 UL
    if (!state?.usePaginationMode || state.isLoading?.() || state.isEmpty?.()) {
      return tree;
    }

    const cardSupport = 'walsgit-discussion-cards' in flarum.extensions;

    // 取当前页 items
    const pageSize = state.options?.perPage || 0;
    const pageNum = state.page || 1;
    const params = state.getParams?.() || {};
    const allPages = state.getPages ? state.getPages(true) : [];
    let items = [];
    if (Array.isArray(allPages) && allPages.length) {
      const curr = allPages.find(p => p?.number === state.location?.page) || allPages[0];
      if (curr && Array.isArray(curr.items)) items = curr.items;
    }

    const liChildren = items.length
      ? items.map((discussion, itemNum) => (
          <li
            key={discussion.id()}
            data-id={discussion.id()}
            role="article"
            aria-setsize={-1}
            aria-posinset={(pageNum * pageSize) + itemNum}
          >
            <DiscussionListItem discussion={discussion} params={params} />
          </li>
        ))
      : null;

    // 工具
    const getClass = (attrs) => String((attrs && (attrs.className || attrs.class)) || '');
    const isUlList = (n) => n && n.tag === 'ul' && getClass(n.attrs).includes('DiscussionList-discussions');
    const childrenRef = (nodeOrArr) => {
      if (Array.isArray(nodeOrArr)) return nodeOrArr;
      if (nodeOrArr && Array.isArray(nodeOrArr.children)) return nodeOrArr.children;
      return null;
    };

    // 收集所有 UL
    const uls = [];
    (function walk(node, parent, indexInParent) {
      if (!node) return;
      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) walk(node[i], node, i);
        return;
      }
      if (typeof node === 'string' || typeof node === 'number') return;

      if (isUlList(node)) uls.push({ node, parent, index: indexInParent });

      const ch = childrenRef(node);
      if (ch) for (let i = 0; i < ch.length; i++) walk(ch[i], node, i);
    })(tree, null, null);

    // cards：只插 Toolbar
    if (cardSupport) {
      insertToolbars(position(), tree, uls.length ? uls[0] : null, state);
      return tree;
    }

    // 非 cards：原位替换 children，移除空壳 UL
    if (uls.length > 0) {
      let keep = uls.find(e => {
        const ch = childrenRef(e.node);
        return ch && ch.some(c => c && c.tag === 'li');
      }) || uls.find(e => e.node?.attrs && 'aria-busy' in e.node.attrs) || uls[0];

      if (liChildren) {
        const ch = childrenRef(keep.node);
        if (ch) { ch.splice(0, ch.length, ...liChildren); }
        else { keep.node.children = liChildren; }
      }

      for (let i = uls.length - 1; i >= 0; i--) {
        const e = uls[i];
        if (e === keep) continue;
        const parentArr = childrenRef(Array.isArray(e.parent) ? e.parent : e.parent);
        if (!parentArr) continue;
        const idx = e.index ?? parentArr.indexOf(e.node);
        if (idx >= 0 && parentArr[idx] === e.node) {
          const hasLi = (childrenRef(e.node) || []).some(c => c && c.tag === 'li');
          if (!hasLi) parentArr.splice(idx, 1);
        }
      }

      insertToolbars(position(), tree, keep, state);
      return tree;
    }

    // 未找到 UL：不新增 UL，仅在根插 Toolbar
    insertToolbars(position(), tree, null, state);
    return tree;

    function position() {
      return app.forum.attribute('foskym-pagination.paginationPosition'); // 'above' | 'under' | 'both'
    }

    function insertToolbars(pos, rootTree, targetEntry, listState) {
      const above = pos === 'above' || pos === 'both';
      const under = pos === 'under' || pos === 'both';
      if (!above && !under) return;

      const toolbarVNode = Toolbar.component({ state: listState });

      if (targetEntry && targetEntry.parent) {
        const parent = targetEntry.parent;
        const arr = childrenRef(Array.isArray(parent) ? parent : parent);
        if (!arr) return;
        let idx = targetEntry.index ?? arr.indexOf(targetEntry.node);
        if (idx < 0) idx = 0;

        if (above) arr.splice(idx, 0, toolbarVNode);
        if (under) arr.splice(idx + (above ? 2 : 1), 0, toolbarVNode);
      } else {
        const rc = childrenRef(rootTree);
        if (!rc) return;
        if (above) rc.unshift(toolbarVNode);
        if (under) rc.push(toolbarVNode);
      }
    }
  });
}
