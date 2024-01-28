import app from 'flarum/forum/app';


export default function () {

  if(app.session.user === null) {
    return Boolean(app.forum.attribute('NodelocPagination.PaginationFirst'));
  }

  if (Boolean(app.forum.attribute('NodelocPagination.CanUserPref'))) {
    if (!Boolean(app.session.user.preferences().DLP_UserCustom)) {
      return Boolean(app.forum.attribute('NodelocPagination.PaginationFirst'));
    } else {
      if (!Boolean(app.session.user.preferences().DLP_UserPaginationFirst)) {
        return false;
      }
    }
  } else {
    return Boolean(app.forum.attribute('NodelocPagination.PaginationFirst'));
  }

  return true;
}

