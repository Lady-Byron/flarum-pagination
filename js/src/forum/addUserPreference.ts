import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import SettingsPage from 'flarum/forum/components/SettingsPage';
import FieldSet from 'flarum/common/components/FieldSet';
import ItemList from 'flarum/common/utils/ItemList';
import Switch from 'flarum/common/components/Switch';
import Stream from 'flarum/common/utils/Stream';

export default function () {
  extend(SettingsPage.prototype, 'oninit', function () {
    const user = this.user as any;
    const preferences = user.preferences() as any;
    this.userCustom = Stream(preferences['foskym-pagination.userCustom']);
    this.userPaginationOnLoading = Stream(preferences['foskym-pagination.userPaginationOnLoading']);
  });

  extend(SettingsPage.prototype, 'settingsItems', function (items) {
    if (Boolean(app.forum.attribute('foskym-pagination.canUserPref'))) {
      items.add(
        'pagination_settings',
        FieldSet.component(
          {
            label: app.translator.trans('foskym-pagination.forum.user.settings.head'),
            className: 'SettingsPage-pagination',
          },
          this.Pagination_UserPrefItems().toArray()
        )
      );
    }
  });

  SettingsPage.prototype['Pagination_UserPrefItems'] = function () {
    const items = new ItemList();
    items.add(
      'foskym-pagination.userCustom',
      Switch.component(
        {
          state: this.user.preferences()['foskym-pagination.userCustom'],
          onchange: (value) => {
            this.UserCustom_Loading = true;
            this.user.savePreferences({ 'foskym-pagination.userCustom': value }).then(() => {
              this.UserCustom_Loading = false;
              m.redraw();
            });
          },
          loading: this.UserCustom_Loading,
        },
        app.translator.trans('foskym-pagination.forum.user.settings.userCustom')
      )
    );

    if (this.user.preferences()['foskym-pagination.userCustom']) {
      items.add(
        'foskym-pagination.userPaginationOnLoading',
        Switch.component(
          {
            state: this.user.preferences()['foskym-pagination.userPaginationOnLoading'],
            onchange: (value) => {
              this.userPaginationOnLoading_Loading = true;
              this.user.savePreferences({ 'foskym-pagination.userPaginationOnLoading': value }).then(() => {
                this.userPaginationOnLoading_Loading = false;
                m.redraw();
              });
            },
            loading: this.userPaginationOnLoading_Loading,
          },
          app.translator.trans('foskym-pagination.forum.user.settings.userPaginationOnLoading')
        )
      );
    }

    return items;
  };
}
