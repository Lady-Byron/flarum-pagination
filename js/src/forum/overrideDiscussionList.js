import app from 'flarum/common/app';
import { override } from 'flarum/common/extend';
import DiscussionList from 'flarum/forum/components/DiscussionList';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import classList from 'flarum/common/utils/classList';
import Toolbar from './components/Toolbar';

/**
 * 最小修补要点：
 * - 不“换根”，基于 original() 返回的树做“定点替换” UL，避免 VDOM 生命周期错位
 * - 未加载/空列表时完全交回 original()，避免结构抖动
 * - 仅在非 cards 模式下替换 UL；cards 模式保留原渲染，只追加工具条
 * - 保留其它扩展（含 Realtime）对 view 的挂钩
 */
export default function () {
  override(DiscussionList.prototype, 'view', function (original) {
    const state = this.attrs.state;
    if (!state?.usePaginationMode) return original();

    // 加载中/空列表：不介入，交还给原实现（避免换根/Fragment）
    if (state.isLoading() || state.isEmpty()) return original();

    const params = state.getParams();
    const position = app.forum.attribute('foskym-pagination.paginationPosition');
    const pageSize = state.options.perPage;
    const pageNum = state.page;

    // 取当前页 items
    const pages = state.getPages();
    let items = [];
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].number === state.location.page) {
        items = pages[i].items;
        break;
      }
    }

    // 构造替换用的 <ul>
    const listVNode = (
      <ul role="feed" aria-busy={false} className="DiscussionList-discussions">
        {items.map((discussion, itemNum) => (
          <li
            key={discussion.id()}
            data-id={discussion.id()}
            role="article"
            aria-setsize={-1}
            aria-posinset={pageNum * pageSize + itemNum}
          >
            <DiscussionListItem discussion={discussion} params={params} />
          </li>
        ))}
      </ul>
    );

    // 原始树（保持根/attrs/钩子不变）
    const tree = original();
    tree.attrs = tree.attrs || {};
    tree.attrs.className = classList(
      'DiscussionList',
      { 'DiscussionList--searchResults': state.isSearchResults() },
      tree.attrs.className
    );

    const kids = Array.isArray(tree.children) ? tree.children.slice() : [];
    const cardSupport = 'walsgit-discussion-cards' in flarum.extensions;

    if (!cardSupport) {
      // 非 cards：查找并替换 UL；找不到则追加（不清空 children）
      let replaced = false;
      for (let i = 0; i < kids.length; i++) {
        const c = kids[i];
        if (c && c.tag === 'ul' && c.attrs && String(c.attrs.className || '').includes('DiscussionList-discussions')) {
          kids[i] = listVNode;
          replaced = true;
          break;
        }
      }
      if (!replaced) kids.push(listVNode);
    }
    // cards 模式：保留原列表渲染，避免双重结构

    // 在上/下插入分页工具条
    if (position === 'above' || position === 'both') kids.unshift(Toolbar.component({ state }));
    if (position === 'under' || position === 'both') kids.push(Toolbar.component({ state }));

    tree.children = kids;
    return tree;
  });
}
