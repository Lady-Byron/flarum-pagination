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
