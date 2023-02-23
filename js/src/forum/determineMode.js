import app from 'flarum/forum/app';


export default function () {

  if(app.session.user === null) {
    return Boolean(app.forum.attribute('LrysiaPagination.PaginationFirst'));
  }

  if (Boolean(app.forum.attribute('LrysiaPagination.CanUserPref'))) {
    if (!Boolean(app.session.user.preferences().DLP_UserCustom)) {
      return Boolean(app.forum.attribute('LrysiaPagination.PaginationFirst'));
    } else {
      if (!Boolean(app.session.user.preferences().DLP_UserPaginationFirst)) {
        return false;
      }
    }
  } else {
    return Boolean(app.forum.attribute('LrysiaPagination.PaginationFirst'));
  }

  return true;
}

