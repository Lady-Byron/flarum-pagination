import app from 'flarum/common/app';
import { override } from 'flarum/common/extend';
import DiscussionList from 'flarum/forum/components/DiscussionList';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import classList from 'flarum/common/utils/classList';
import Toolbar from './components/Toolbar';

/**
 * 修复要点（仅此文件）：
 * - 绝不新建第二个 <ul.DiscussionList-discussions>。
 * - 深度遍历整棵 VDOM，原位找到现有的 UL，并只替换其 children（不改 attrs、不换节点）。
 * - 若同时存在其它“空壳”UL，就地删除（父级 children 中 splice 掉）。
 * - 工具条 Toolbar 仅作为 UL 的兄弟节点插入（上/下），不改动 UL 本体。
 * - 在 cards 模式下完全不触碰 UL，只插 Toolbar。
 * - 未找到 UL 时不做任何 UL 追加（避免制造第二个 UL）。
 *
 * 额外增强（与方案A匹配）：
 * - 若 state.silentRestoreOnce 为 true（回退命中缓存的首帧），移除该帧中的 LoadingIndicator，避免闪烁；
 *   仅影响该帧视觉，不改变任何数据/逻辑，下一帧自动恢复原状。
 */
export default function () {
  override(DiscussionList.prototype, 'view', function (original) {
    const state = this.attrs?.state;
    const tree = original();

    // 给根增加类（不影响结构）
    tree.attrs = tree.attrs || {};
    tree.attrs.className = classList(
      'DiscussionList',
      { 'DiscussionList--searchResults': state?.isSearchResults?.() },
      tree.attrs.className
    );

    // --- [SilentRestore]：移除本帧 LoadingIndicator，避免“回退命中缓存”时的一闪 ---
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
    // --- [SilentRestore] 结束 ---

    // 非分页模式、加载中或空列表：不干预 UL，直接返回
    if (!state?.usePaginationMode || state.isLoading?.() || state.isEmpty?.()) {
      return tree;
    }

    const cardSupport = 'walsgit-discussion-cards' in flarum.extensions;

    // 取当前页 items（用于生成 <li>）
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

    // 工具函数
    const getClass = (attrs) => String((attrs && (attrs.className || attrs.class)) || '');
    const isUlList = (n) => n && n.tag === 'ul' && getClass(n.attrs).includes('DiscussionList-discussions');
    const childrenRef = (nodeOrArr) => {
      if (Array.isArray(nodeOrArr)) return nodeOrArr;
      if (nodeOrArr && Array.isArray(nodeOrArr.children)) return nodeOrArr.children;
      return null;
    };

    // 深度收集所有 UL 以及其父引用
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

    // cards 模式：不触碰 UL，只插 Toolbar
    if (cardSupport) {
      insertToolbars(position(), tree, uls.length ? uls[0] : null, state);
      return tree;
    }

    // 非 cards：只原位替换 UL 的 children，并去除空壳 UL
    if (uls.length > 0) {
      // 选择要保留的 UL：优先已有 <li> 的；其次带 aria-busy 的；否则第一个
      let keep = uls.find(e => {
        const ch = childrenRef(e.node);
        return ch && ch.some(c => c && c.tag === 'li');
      }) || uls.find(e => e.node?.attrs && 'aria-busy' in e.node.attrs) || uls[0];

      // 仅当我们生成了 liChildren 时才替换 children；否则保持原样
      if (liChildren) {
        const ch = childrenRef(keep.node);
        if (ch) { ch.splice(0, ch.length, ...liChildren); }
        else { keep.node.children = liChildren; }
      }

      // 删除其它空壳 UL（没有 <li> 的）
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

      // 在保留的 UL 附近插入工具条
      insertToolbars(position(), tree, keep, state);
      return tree;
    }

    // 若未找到任何 UL：不追加 UL，避免制造第二个；只按需在根加 Toolbar
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
