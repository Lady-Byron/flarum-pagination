<?php

/*
 * This file is part of nodeloc/pagination.
 *
 * Copyright (c) 2023 .
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Nodeloc\Pagination;

use Flarum\Extend;

return [

    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/resources/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/resources/less/admin.less'),

    (new Extend\Settings())
        -> serializeToForum('NodelocPagination.CanUserPref', 'NodelocPagination.CanUserPref', 'boolVal')
        -> serializeToForum('NodelocPagination.PaginationFirst', 'NodelocPagination.PaginationFirst', 'boolVal')
        -> serializeToForum('NodelocPagination.PerPage', 'NodelocPagination.PerPage', 'intVal')
        -> serializeToForum('NodelocPagination.PerIndexInit', 'NodelocPagination.PerIndexInit', 'intVal')
        -> serializeToForum('NodelocPagination.PerLoadMore', 'NodelocPagination.PerLoadMore', 'intVal')
        -> serializeToForum('NodelocPagination.NavBarPosition', 'NodelocPagination.NavBarPosition')
        -> default('NodelocPagination.CanUserPref', false)
        -> default('NodelocPagination.PaginationFirst', true)
        -> default('NodelocPagination.PerPage', 20)
        -> default('NodelocPagination.PerIndexInit', 20)
        -> default('NodelocPagination.PerLoadMore', 20)
        -> default('NodelocPagination.NavBarPosition', 'under'),

    (new Extend\User())
        ->registerPreference('DLP_UserCustom', 'boolVal', false)
        ->registerPreference('DLP_UserPaginationFirst', 'boolVal', true),

    new Extend\Locales(__DIR__.'/resources/locale'),

];
