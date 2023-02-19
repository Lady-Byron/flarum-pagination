import app from 'flarum/forum/app';


export default function () {

  if (Boolean(app.forum.attribute('LrysiaPagination.CanUserPref'))) {
    if (!Boolean(app.session.user.preferences().DLP_UserCustom)) {
      if (!Boolean(app.forum.attribute('LrysiaPagination.PaginationFirst'))) {
        return false;
      }
    } else {
      if (!Boolean(app.session.user.preferences().DLP_UserPaginationFirst)) {
        return false;
      }
    }
  } else {
    if (!Boolean(app.forum.attribute('LrysiaPagination.PaginationFirst'))) {
      return false;
    }
  }

  return true;
}
