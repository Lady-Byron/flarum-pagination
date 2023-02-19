import app from 'flarum/admin/app';

app.initializers.add('lrysia/pagination', () => {
  app.extensionData.for('lrysia-pagination')
    .registerSetting({
      label: app.translator.trans('Lrysia-DLP.admin.settings.pagination.CanUserPref'),
      setting: 'LrysiaPagination.CanUserPref',
      type: 'boolean',
    })
    .registerSetting({
      label: app.translator.trans('Lrysia-DLP.admin.settings.pagination.PaginationFirst'),
      help: app.translator.trans('Lrysia-DLP.admin.settings.pagination.PaginationFirst-Help'),
      setting: 'LrysiaPagination.PaginationFirst',
      type: 'boolean',
    })
    .registerSetting({
      label: app.translator.trans('Lrysia-DLP.admin.settings.pagination.NavBarPosition'),
      setting: 'LrysiaPagination.NavBarPosition',
      options: {
        'above': app.translator.trans('Lrysia-DLP.admin.settings.pagination.Position.Above'),
        'under': app.translator.trans('Lrysia-DLP.admin.settings.pagination.Position.Under'),
        'both': app.translator.trans('Lrysia-DLP.admin.settings.pagination.Position.Both'),
      },
      type: 'select',
    })
    .registerSetting({
      label: app.translator.trans('Lrysia-DLP.admin.settings.pagination.PerPage'),
      setting: 'LrysiaPagination.PerPage',
      type: 'number',
      min: 1,
      max: 50,
    })
    .registerSetting({
      label: app.translator.trans('Lrysia-DLP.admin.settings.pagination.PerIndexInit'),
      setting: 'LrysiaPagination.PerIndexInit',
      type: 'number',
      min: 1,
      max: 50,
    })
    .registerSetting({
      label: app.translator.trans('Lrysia-DLP.admin.settings.pagination.PerLoadMore'),
      setting: 'LrysiaPagination.PerLoadMore',
      type: 'number',
      min: 1,
      max: 50,
    })
});
