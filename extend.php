<?php

/*
 * This file is part of lrysia/pagination.
 *
 * Copyright (c) 2023 .
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Lrysia\Pagination;

use Flarum\Extend;

return [

    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/resources/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/resources/less/admin.less'),

    (new Extend\Settings())
        -> serializeToForum('LrysiaPagination.CanUserPref', 'LrysiaPagination.CanUserPref', 'boolVal')
        -> serializeToForum('LrysiaPagination.PaginationFirst', 'LrysiaPagination.PaginationFirst', 'boolVal')
        -> serializeToForum('LrysiaPagination.PerPage', 'LrysiaPagination.PerPage', 'intVal')
        -> serializeToForum('LrysiaPagination.PerIndexInit', 'LrysiaPagination.PerIndexInit', 'intVal')
        -> serializeToForum('LrysiaPagination.PerLoadMore', 'LrysiaPagination.PerLoadMore', 'intVal')
        -> serializeToForum('LrysiaPagination.NavBarPosition', 'LrysiaPagination.NavBarPosition')
        -> default('LrysiaPagination.CanUserPref', false)
        -> default('LrysiaPagination.PaginationFirst', true)
        -> default('LrysiaPagination.PerPage', 20)
        -> default('LrysiaPagination.PerIndexInit', 20)
        -> default('LrysiaPagination.PerLoadMore', 20)
        -> default('LrysiaPagination.NavBarPosition', 'under'),

    (new Extend\User())
        ->registerPreference('DLP_UserCustom', 'boolVal', false)
        ->registerPreference('DLP_UserPaginationFirst', 'boolVal', true),

    new Extend\Locales(__DIR__.'/resources/locale'),

];
