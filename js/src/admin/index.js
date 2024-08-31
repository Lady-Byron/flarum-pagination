import app from 'flarum/admin/app';

app.initializers.add('foskym/flarum-pagination', () => {
  app.extensionData.for('foskym-pagination')
    .registerSetting({
      label: app.translator.trans('foskym-pagination.admin.settings.pagination.canUserPref'),
      setting: 'foskym-pagination.canUserPref',
      type: 'boolean',
    })
    .registerSetting({
      label: app.translator.trans('foskym-pagination.admin.settings.pagination.paginationOnLoading'),
      help: app.translator.trans('foskym-pagination.admin.settings.pagination.paginationOnLoading-Help'),
      setting: 'foskym-pagination.paginationOnLoading',
      type: 'boolean',
    })
    .registerSetting({
      label: app.translator.trans('foskym-pagination.admin.settings.pagination.cacheDiscussions'),
      help: app.translator.trans('foskym-pagination.admin.settings.pagination.cacheDiscussions-Help'),
      setting: 'foskym-pagination.cacheDiscussions',
      type: 'boolean',
    })
    .registerSetting({
      label: app.translator.trans('foskym-pagination.admin.settings.pagination.paginationPosition'),
      setting: 'foskym-pagination.paginationPosition',
      options: {
        'above': app.translator.trans('foskym-pagination.admin.settings.pagination.position.above'),
        'under': app.translator.trans('foskym-pagination.admin.settings.pagination.position.under'),
        'both': app.translator.trans('foskym-pagination.admin.settings.pagination.position.both'),
      },
      type: 'select',
    })
    .registerSetting({
      label: app.translator.trans('foskym-pagination.admin.settings.pagination.perPage'),
      setting: 'foskym-pagination.perPage',
      type: 'number',
      min: 1,
      max: 50,
    })
    .registerSetting({
      label: app.translator.trans('foskym-pagination.admin.settings.pagination.perIndexInit'),
      setting: 'foskym-pagination.perIndexInit',
      type: 'number',
      min: 1,
      max: 50,
    })
    .registerSetting({
      label: app.translator.trans('foskym-pagination.admin.settings.pagination.perLoadMore'),
      setting: 'foskym-pagination.perLoadMore',
      type: 'number',
      min: 1,
      max: 50,
    })
});
