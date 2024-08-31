<?php

/*
 * This file is part of foskym/flarum-pagination.
 *
 * Copyright (c) 2024 FoskyM.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace FoskyM\Pagination;

use Flarum\Extend;
use Flarum\Api\Controller\AbstractSerializeController;
use Flarum\Api\Controller\ListDiscussionsController;
use Flarum\Filter\AbstractFilterer;
use Flarum\Discussion\Filter\DiscussionFilterer;
use Flarum\Discussion\Search\DiscussionSearcher;

return [

    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/resources/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/resources/less/admin.less'),

    new Extend\Locales(__DIR__.'/resources/locale'),

    (new Extend\Settings())
        -> serializeToForum('foskym-pagination.canUserPref', 'foskym-pagination.canUserPref', 'boolVal')
        -> serializeToForum('foskym-pagination.paginationOnLoading', 'foskym-pagination.paginationOnLoading', 'boolVal')
        -> serializeToForum('foskym-pagination.cacheDiscussions', 'foskym-pagination.cacheDiscussions', 'boolVal')
        -> serializeToForum('foskym-pagination.perPage', 'foskym-pagination.perPage', 'intVal')
        -> serializeToForum('foskym-pagination.perIndexInit', 'foskym-pagination.perIndexInit', 'intVal')
        -> serializeToForum('foskym-pagination.perLoadMore', 'foskym-pagination.perLoadMore', 'intVal')
        -> serializeToForum('foskym-pagination.paginationPosition', 'foskym-pagination.paginationPosition')
        -> default('foskym-pagination.canUserPref', false)
        -> default('foskym-pagination.paginationOnLoading', true)
        -> default('foskym-pagination.cacheDiscussions', true)
        -> default('foskym-pagination.perPage', 20)
        -> default('foskym-pagination.perIndexInit', 20)
        -> default('foskym-pagination.perLoadMore', 20)
        -> default('foskym-pagination.paginationPosition', 'under'),

    (new Extend\User())
        ->registerPreference('foskym-pagination.userCustom', 'boolVal', false)
        ->registerPreference('foskym-pagination.userPaginationOnLoading', 'boolVal', true),

    (new Extend\ApiController(AbstractSerializeController::class))
        ->prepareDataForSerialization(LoadPagination::class),

    (new Extend\Filter(DiscussionFilterer::class))
        ->addFilterMutator(Filter\Filter::class),

    (new Extend\SimpleFlarumSearch(DiscussionSearcher::class))
        ->addSearchMutator(Search\Search::class),

    (new Extend\Middleware('api'))
        ->add(Middleware\PaginationMiddleware::class)
];
