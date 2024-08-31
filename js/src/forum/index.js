import app from 'flarum/common/app';
import { extend, override } from 'flarum/common/extend';

import DiscussionComposer from 'flarum/forum/components/DiscussionComposer';
import DiscussionControls from 'flarum/forum/utils/DiscussionControls';

import addUserPreference from './addUserPreference';
import overrideDiscussionListState from './overrideDiscussionListState';
import overrideDiscussionList from './overrideDiscussionList';


app.initializers.add('foskym/flarum-pagination', () => {
  addUserPreference();
  overrideDiscussionListState();
  overrideDiscussionList();

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
