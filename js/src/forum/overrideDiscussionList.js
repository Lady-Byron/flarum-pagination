import app from 'flarum/common/app';
import { override } from 'flarum/common/extend';
import DiscussionList from 'flarum/forum/components/DiscussionList';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import Placeholder from 'flarum/common/components/Placeholder';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import classList from 'flarum/common/utils/classList';
import Toolbar from './components/Toolbar';

/**
 * 最小修补：
 * - 保留 original() 返回的整棵树，让其它扩展（含 Realtime）挂钩仍然生效
 * - 仅替换 <ul.DiscussionList-discussions> 这一块的内容
 * - 在上/下插入分页工具条，而不是清空 children
 */
export default function () {
  override(DiscussionList.prototype, 'view', function (original) {
    const state = this.attrs.state;

    // 未启用分页：完全走原生视图（含 Realtime 的挂钩）
    if (!state?.usePaginationMode) {
      return original();
    }

    const isLoading = state.isLoading();
    const params = state.getParams();
    const position = app.forum.attribute('foskym-pagination.paginationPosition');
    const pageSize = state.options.perPage;
    const pageNum = state.page;

    // 拿到原始树，后续在其中“定点替换”列表节点
    const tree = original();

    // 生成分页模式下应显示的 <ul>（或占位/加载态）
    let replacementVNode;

    if (state.isEmpty()) {
      const text = app.translator.trans('core.forum.discussion_list.empty_text');
      replacementVNode = <Placeholder text={text} />;
    } else if (isLoading) {
      replacementVNode = (
        <>
          <ul role="feed" aria-busy={true} className="DiscussionList-discussions" />
          <div className="DiscussionList-loadMore">
            <LoadingIndicator />
          </div>
        </>
      );
    } else {
      const pages = state.getPages(); // 在 state 补丁里已适配“只取当前页”
      let items = [];
      for (let i = 0; i < pages.length; i++) {
        if (pages[i].number === state.location.page) {
          items = pages[i].items;
          break;
        }
      }
      replacementVNode = (
        <ul role="feed" aria-busy={false} className="DiscussionList-discussions">
          {items.map((discussion, itemNum) => (
            <li
              key={discussion.id()}
              data-id={discussion.id()}
              role="article"
              aria-setsize="-1"
              aria-posinset={pageNum * pageSize + itemNum}
            >
              <DiscussionListItem discussion={discussion} params={params} />
            </li>
          ))}
        </ul>
      );
    }

    // 兼容 walsgit-discussion-cards：不裁剪 original 的 children，直接在上下追加工具条
    const cardSupport = 'walsgit-discussion-cards' in flarum.extensions;

    // 把 original() 的顶层 <div.DiscussionList ...> 取出来
    const outer = tree;
    const outerClass = classList(
      'DiscussionList',
      { 'DiscussionList--searchResults': state.isSearchResults() },
      outer.attrs?.className
    );

    // 在原始 children 里查找/替换 <ul.DiscussionList-discussions>；找不到则追加
    const kids = Array.isArray(outer.children) ? outer.children.slice() : [];
    let replaced = false;

    // 简单匹配器：匹配 ul.DiscussionList-discussions（或原来就没有 ul 时追加）
    for (let i = 0; i < kids.length; i++) {
      const c = kids[i];
      if (c && c.tag === 'ul' && c.attrs && String(c.attrs.className || '').includes('DiscussionList-discussions')) {
        kids[i] = replacementVNode;
        replaced = true;
        break;
      }
    }
    if (!replaced) kids.push(replacementVNode);

    // 在上/下插入分页工具条
    const toolbarAbove = (position === 'above' || position === 'both') ? Toolbar.component({ state }) : null;
    const toolbarUnder = (position === 'under' || position === 'both') ? Toolbar.component({ state }) : null;

    // 拼接最终 children（保持原有顺序，避免清空导致其它扩展节点丢失）
    const finalChildren = [];
    if (toolbarAbove) finalChildren.push(toolbarAbove);
    finalChildren.push(...kids);
    if (toolbarUnder) finalChildren.push(toolbarUnder);

    return (
      <div className={outerClass} attrs={outer.attrs}>
        {finalChildren}
      </div>
    );
  });
}
