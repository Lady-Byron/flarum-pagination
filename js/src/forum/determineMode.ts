import app from 'flarum/forum/app';

export default function () {
  if (app.session.user === null) {
    return app.forum.attribute('foskym-pagination.paginationOnLoading');
  }

  const preferences = app.session.user.preferences() as any;

  if (app.forum.attribute('foskym-pagination.canUserPref')) {
    if (!preferences['foskym-pagination.userCustom']) {
      return app.forum.attribute('foskym-pagination.paginationOnLoading');
    } else {
      if (!preferences['foskym-pagination.userPaginationOnLoading']) {
        return false;
      }
    }
  } else {
    return app.forum.attribute('foskym-pagination.paginationOnLoading');
  }

  return true;
}
