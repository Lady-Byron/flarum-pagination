<?php

/*
 * This file is part of Flarum.
 *
 * For detailed copyright and license information, please view the
 * LICENSE file that was distributed with this source code.
 */

namespace Flarum\Search;

use Flarum\Query\ApplyQueryParametersTrait;
use Flarum\Query\QueryCriteria;
use Flarum\Query\QueryResults;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Builder;
// added by lrysia/pagination
use Illuminate\Database\Query\Builder as QBulider;

abstract class AbstractSearcher
{
    use ApplyQueryParametersTrait;

    /**
     * @var GambitManager
     */
    protected $gambits;

    /**
     * @var array
     */
    protected $searchMutators;

    public function __construct(GambitManager $gambits, array $searchMutators)
    {
        $this->gambits = $gambits;
        $this->searchMutators = $searchMutators;
    }

    abstract protected function getQuery(User $actor): Builder;

    /**
     * @param QueryCriteria $criteria
     * @param int|null $limit
     * @param int $offset
     *
     * @return QueryResults
     */
    public function search(QueryCriteria $criteria, $limit = null, $offset = 0): QueryResults
    {
        $actor = $criteria->actor;

        $query = $this->getQuery($actor);

        $search = new SearchState($query->getQuery(), $actor);

        $this->gambits->apply($search, $criteria->query['q']);


        // added by lrysia/pagination
        // 1. $query是Eloquent/builder，调用 getQuery() 返回的是个 Query/builder
        // 2. 直接用 $query->count()时，实为 Query/builder->count()
        // 3. Query/builder->count() 再次调用 Query/builder->aggregate()
        // 4. 在"搜索"情景下，aggregate() 的返回结果不是我们需要的
        // 5. 在"搜索"情景下，aggregate() 中的 $result->items 会变成包含多个对象的列表
        // 6. 而在"filter"情境下，$result->items 始终是只包含一个对象的列表
        // 7. 在"搜索"情景下，列表中的每个对象代表一个帖子，而每个对象的count数代表该帖子内符合查询条件的条目数
        // 8. 在"filter"情境下，列表只有一个对象，这个对象的count数就是符合查询条件的帖子数
        // 9. 观察到 aggregate() 的 return 硬编码了“[0]”，这导致返回值始终是列表内第一个对象的count数
        // 10. 基于避免修改原函数的原则，这里给 Query/builder 添加了一个能正确返回"搜索"情景下count数的新方法
        QBulider::macro( 'countForSearch', function ($function='count',$columns=['*']) {
            $results = $this->cloneWithout($this->unions || $this->havings ? [] : ['columns'])
                ->cloneWithoutBindings($this->unions || $this->havings ? [] : ['select'])
                ->setAggregate($function, $columns)
                ->get($columns);
            return $results;
        });
        $q_builder = $query->getQuery();
        $totalResultsCount = count($q_builder->countForSearch()->all());


        $this->applySort($search, $criteria->sort, $criteria->sortIsDefault);
        $this->applyOffset($search, $offset);
        $this->applyLimit($search, $limit + 1);

        foreach ($this->searchMutators as $mutator) {
            $mutator($search, $criteria);
        }


        // Execute the search query and retrieve the results. We get one more
        // results than the user asked for, so that we can say if there are more
        // results. If there are, we will get rid of that extra result.
        $results = $query->get();


        if ($areMoreResults = $limit > 0 && $results->count() > $limit) {
            $results->pop();
        }


        // added by lrysia/pagination
        $results->totalResultsCount = $totalResultsCount;


        return new QueryResults($results, $areMoreResults);
    }
}
