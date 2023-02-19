import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import SettingsPage from 'flarum/forum/components/SettingsPage';
import FieldSet from 'flarum/common/components/FieldSet';
import ItemList from 'flarum/common/utils/ItemList';
import Switch from 'flarum/common/components/Switch';
import Stream from 'flarum/common/utils/Stream';

export default function () {
  extend(SettingsPage.prototype, 'oninit', function () {
    this.DLP_UserCustom = Stream(this.user.preferences().DLP_UserCustom);
    this.DLP_UserPaginationFirst = Stream(this.user.preferences().DLP_UserPaginationFirst);
  });

  extend(SettingsPage.prototype, 'settingsItems', function (items) {
    if (Boolean(app.forum.attribute('LrysiaPagination.CanUserPref'))) {
      items.add(
        'Lrysia_DLP_User',
        FieldSet.component(
          {
            label: app.translator.trans('Lrysia-DLP.forum.user.settings.Head'),
            className: 'Lrysia_DLP_PrefSettings',
          },
          this.Lrysia_DLP_UserPrefItems().toArray()
        )
      );
    }
  });

  SettingsPage.prototype['Lrysia_DLP_UserPrefItems'] = function () {
    const items = new ItemList();
    items.add(
      'Lrysia_DLP_UserCustom',
      Switch.component(
        {
          state: this.user.preferences().DLP_UserCustom,
          onchange: (value) => {
            this.UserCustomLoading = true;
            this.user.savePreferences({ DLP_UserCustom: value }).then(() => {
              this.UserCustomLoading = false;
              m.redraw();
            });
          },
          loading: this.UserCustomLoading,
        },
        app.translator.trans('Lrysia-DLP.forum.user.settings.DLP_UserCustom')
      )
    );

    if (this.user.preferences().DLP_UserCustom) {
      items.add(
        'Lrysia_DLP_UserPaginationFirst',
        Switch.component(
          {
            state: this.user.preferences().DLP_UserPaginationFirst,
            onchange: (value) => {
              this.UserPaginationFirstLoading = true;
              this.user.savePreferences({ DLP_UserPaginationFirst: value }).then(() => {
                this.UserPaginationFirstLoading = false;
                m.redraw();
              });
            },
            loading: this.UserPaginationFirstLoading,
          },
          app.translator.trans('Lrysia-DLP.forum.user.settings.DLP_UserPaginationFirst')
        )
      );
    }

    return items;
  };
}
