import app from 'flarum/common/app';
import { override } from 'flarum/common/extend';
import DiscussionList from 'flarum/forum/components/DiscussionList';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import Placeholder from 'flarum/common/components/Placeholder';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import classList from 'flarum/common/utils/classList';
import Toolbar from './components/Toolbar';

export default function () {
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

    const position = app.forum.attribute('foskym-pagination.paginationPosition');
    const pageSize = state.options.perPage;
    const pageNum = state.page;

    return (
      <div className={classList('DiscussionList', { 'DiscussionList--searchResults': state.isSearchResults() })}>
        {position == 'above' || position == 'both' ? Toolbar.component({ state }) : ''}
        <ul role="feed" aria-busy={isLoading} className="DiscussionList-discussions">
          {items.map((discussion, itemNum) => (
            <li key={discussion.id()} data-id={discussion.id()} role="article" aria-setsize="-1" aria-posinset={pageNum * pageSize + itemNum}>
              <DiscussionListItem discussion={discussion} params={params} />
            </li>
          ))}
        </ul>
        {position == 'under' || position == 'both' ? Toolbar.component({ state }) : ''}
      </div>
    );
  });
}
