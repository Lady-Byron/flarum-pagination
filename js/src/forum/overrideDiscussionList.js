import app from 'flarum/common/app';
import { override } from 'flarum/common/extend';
import DiscussionList from 'flarum/forum/components/DiscussionList';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import classList from 'flarum/common/utils/classList';
import Toolbar from './components/Toolbar';

/**
 * 稳定版：
 * - 不“换根”、不更换原 <ul> 节点；只原位替换 children（Realtime 安全）
 * - 同时匹配 className/class，避免漏匹配导致 push 出第二个 <ul>
 * - 找不到原 <ul> 时才追加；末尾做一次去重护栏（只保留第一个）
 */
export default function () {
  override(DiscussionList.prototype, 'view', function (original) {
    const state = this.attrs.state;
    if (!state?.usePaginationMode) return original();

    // 加载中/空列表：完全不介入，交回原实现（避免结构抖动）
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

    // 原始树
    const tree = original();
    tree.attrs = tree.attrs || {};
    tree.attrs.className = classList(
      'DiscussionList',
      { 'DiscussionList--searchResults': state.isSearchResults() },
      tree.attrs.className
    );

    const kids = Array.isArray(tree.children) ? tree.children.slice() : [];
    const cardSupport = 'walsgit-discussion-cards' in flarum.extensions;

    const getClass = (attrs) => String((attrs && (attrs.className || attrs.class)) || '');
    const isUlList = (n) => n && n.tag === 'ul' && getClass(n.attrs).includes('DiscussionList-discussions');

    if (!cardSupport) {
      // 1) 原位替换：找到第一个目标 <ul>，只更新其 children（不改 attrs、不换节点）
      let replaced = false;
      for (let i = 0; i < kids.length; i++) {
        const node = kids[i];
        if (isUlList(node)) {
          node.children = liChildren;   // 仅替换 children —— Realtime 兼容关键
          kids[i] = node;
          replaced = true;
          break;
        }
      }

      // 2) 完全找不到才追加一个新的 <ul>（理论上不应走到这里）
      if (!replaced) {
        kids.push(
          <ul role="feed" className="DiscussionList-discussions">
            {liChildren}
          </ul>
        );
      }

      // 3) 去重护栏：若存在多个 <ul>，只保留第一个（或第一个有 <li> 的）
      let kept = false;
      for (let i = kids.length - 1; i >= 0; i--) {
        const node = kids[i];
        if (isUlList(node)) {
          if (!kept) {
            kept = true; // 保留最前的一个
            continue;
          }
          kids.splice(i, 1); // 移除其余的空壳/重复列表
        }
      }
    }
    // cards 模式：保留原列表渲染，仅追加工具条

    // 在上/下插入分页工具条
    if (position === 'above' || position === 'both') kids.unshift(Toolbar.component({ state }));
    if (position === 'under' || position === 'both') kids.push(Toolbar.component({ state }));

    tree.children = kids;
    return tree;
  });
}
