<?php

/*
 * This file is part of foskym/flarum-pagination.
 *
 * Copyright (c) 2024 FoskyM.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace FoskyM\Pagination\Search;

use Flarum\Search\SearchState;
use Flarum\Query\QueryCriteria;
use Illuminate\Database\Capsule\Manager as DB;

class Search
{
    public function __invoke(SearchState $searchState, QueryCriteria $queryCriteria)
    {
        $query = $searchState->getQuery();
        $query = clone $query;

        $sql = $query->toSql();
        $sql = str_replace('limit ' . $query->limit, '', $sql);
        $sql = str_replace('offset ' . $query->offset, '', $sql);
        $bindings = $query->getBindings();
        $sql = str_replace('?', "'%s'", $sql);
        $sql = vsprintf($sql, $bindings);

        $query = DB::table(DB::raw("($sql) as t"));

        $_REQUEST['totalResultsCount'] = $query->count();
    }
}