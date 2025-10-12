import app from 'flarum/common/app';
import { override } from 'flarum/common/extend';
import DiscussionList from 'flarum/forum/components/DiscussionList';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import classList from 'flarum/common/utils/classList';
import Toolbar from './components/Toolbar';

/**
 * 稳定版（仅此文件修复）：
 * - 深度遍历：在整棵 VDOM 树中查找第一个 <ul.DiscussionList-discussions>
 * - 原位替换：只替换该 UL 的 children，不改 attrs，不更换节点（Realtime 安全）
 * - 去重护栏：删除其余重复 UL（通常是空壳）
 * - 工具条就近插入：在“保留的 UL”父节点上方/下方插入 Toolbar
 * - cards 模式：不改 UL，只插入工具条
 */

export default function () {
  override(DiscussionList.prototype, 'view', function (original) {
    const state = this.attrs.state;
    if (!state?.usePaginationMode) return original();

    // 加载中/空列表：完全不介入，避免结构抖动
    if (state.isLoading() || state.isEmpty()) return original();

    const params = state.getParams();
    const position = app.forum.attribute('foskym-pagination.paginationPosition');
    const pageSize = state.options.perPage;
    const pageNum = state.page;
    const cardSupport = 'walsgit-discussion-cards' in flarum.extensions;

    // 取当前页 items
    const pages = state.getPages();
    let items = [];
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].number === state.location.page) {
        items = pages[i].items;
        break;
      }
    }

    // 仅生成 li（不包 ul）
    const liChildren = items.map((discussion, itemNum) => (
      <li
        key={discussion.id()}
        data-id={discussion.id()}
        role="article"
        aria-setsize={-1}
        aria-posinset={pageNum * pageSize + itemNum}
      >
        <DiscussionListItem discussion={discussion} params={params} />
      </li>
    ));

    // --- 拿到原始树 ---
    const tree = original();
    tree.attrs = tree.attrs || {};
    tree.attrs.className = classList(
      'DiscussionList',
      { 'DiscussionList--searchResults': state.isSearchResults() },
      tree.attrs.className
    );

    // 工具函数
    const getClass = (attrs) => String((attrs && (attrs.className || attrs.class)) || '');
    const isUlList = (n) => n && n.tag === 'ul' && getClass(n.attrs).includes('DiscussionList-discussions');
    const getChildren = (nodeOrArr) => {
      if (Array.isArray(nodeOrArr)) return nodeOrArr;
      const ch = nodeOrArr && nodeOrArr.children;
      return Array.isArray(ch) ? ch : [];
    };

    // 深度收集所有 UL 及其父节点/索引
    const uls = [];
    (function walk(node, parent, indexInParent) {
      if (!node) return;
      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) walk(node[i], node, i);
        return;
      }
      if (typeof node === 'string' || typeof node === 'number') return;

      if (isUlList(node)) uls.push({ node, parent, index: indexInParent });

      const ch = getChildren(node);
      for (let i = 0; i < ch.length; i++) walk(ch[i], node, i);
    })(tree, null, null);

    // cards 模式：只插入工具条，不触碰 UL
    if (cardSupport) {
      // 若能找到“第一个 UL”，把工具条插在它的父节点就近位置；否则退回到根 children
      insertToolbarsNearTarget(position, tree, uls.length ? uls[0] : null, state);
      return tree;
    }

    // 非 cards：必须保证只有一个 UL，并原位替换其 children
    if (uls.length) {
      // 选择要保留的 UL：优先“已有 <li>”的；否则第一个
      let keep = uls.find((e) => getChildren(e.node).length > 0) || uls[0];

      // 原位替换 children（不改 attrs、不换节点）
      keep.node.children = liChildren;

      // 删除其它重复 UL（从后往前删，避免索引移动）
      for (let i = uls.length - 1; i >= 0; i--) {
        const e = uls[i];
        if (e === keep) continue;
        const parent = e.parent;
        const idx = e.index;
        const arr = Array.isArray(parent) ? parent : getChildren(parent);
        if (arr && idx != null && arr[idx] === e.node) {
          // 只移除“空壳”或重复的 UL；保守起见：没有 <li> 才删
          const hasLi = getChildren(e.node).some((c) => c && c.tag === 'li');
          if (!hasLi) arr.splice(idx, 1);
        }
      }

      // 在“保留的 UL”附近插入工具条
      insertToolbarsNearTarget(position, tree, keep, state);
    } else {
      // 未找到任何 UL（极少见）：退化为在根末尾追加一个
      const rootChildren = getChildren(tree);
      rootChildren.push(
        <ul role="feed" className="DiscussionList-discussions">{liChildren}</ul>
      );
      // 工具条靠近这个新 UL
      insertToolbarsNearTarget(
        position,
        tree,
        { node: rootChildren[rootChildren.length - 1], parent: tree, index: rootChildren.length - 1 },
        state
      );
    }

    return tree;

    // === 工具条插入：尽量靠近目标 UL 的父节点 ===
    function insertToolbarsNearTarget(pos, rootTree, targetEntry, listState) {
      const above = (pos === 'above' || pos === 'both');
      const under = (pos === 'under' || pos === 'both');

      const toolbarVNode = Toolbar.component({ state: listState });

      if (targetEntry && targetEntry.parent) {
        const parent = targetEntry.parent;
        const arr = Array.isArray(parent) ? parent : getChildren(parent);
        let idx = arr.indexOf(targetEntry.node);
        if (idx === -1) idx = targetEntry.index ?? 0;

        if (above) arr.splice(idx, 0, toolbarVNode);
        if (under) arr.splice(idx + (above ? 2 : 1), 0, toolbarVNode);
      } else {
        // 兜底：插在根 children
        const rc = getChildren(rootTree);
        if (above) rc.unshift(toolbarVNode);
        if (under) rc.push(toolbarVNode);
      }
    }
  });
}
