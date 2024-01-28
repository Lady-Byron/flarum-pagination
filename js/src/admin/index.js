import app from 'flarum/admin/app';

app.initializers.add('nodeloc/pagination', () => {
  app.extensionData.for('nodeloc-pagination')
    .registerSetting({
      label: app.translator.trans('Nodeloc-DLP.admin.settings.pagination.CanUserPref'),
      setting: 'NodelocPagination.CanUserPref',
      type: 'boolean',
    })
    .registerSetting({
      label: app.translator.trans('Nodeloc-DLP.admin.settings.pagination.PaginationFirst'),
      help: app.translator.trans('Nodeloc-DLP.admin.settings.pagination.PaginationFirst-Help'),
      setting: 'NodelocPagination.PaginationFirst',
      type: 'boolean',
    })
    .registerSetting({
      label: app.translator.trans('Nodeloc-DLP.admin.settings.pagination.NavBarPosition'),
      setting: 'NodelocPagination.NavBarPosition',
      options: {
        'above': app.translator.trans('Nodeloc-DLP.admin.settings.pagination.Position.Above'),
        'under': app.translator.trans('Nodeloc-DLP.admin.settings.pagination.Position.Under'),
        'both': app.translator.trans('Nodeloc-DLP.admin.settings.pagination.Position.Both'),
      },
      type: 'select',
    })
    .registerSetting({
      label: app.translator.trans('Nodeloc-DLP.admin.settings.pagination.PerPage'),
      setting: 'NodelocPagination.PerPage',
      type: 'number',
      min: 1,
      max: 50,
    })
    .registerSetting({
      label: app.translator.trans('Nodeloc-DLP.admin.settings.pagination.PerIndexInit'),
      setting: 'NodelocPagination.PerIndexInit',
      type: 'number',
      min: 1,
      max: 50,
    })
    .registerSetting({
      label: app.translator.trans('Nodeloc-DLP.admin.settings.pagination.PerLoadMore'),
      setting: 'NodelocPagination.PerLoadMore',
      type: 'number',
      min: 1,
      max: 50,
    })
});
