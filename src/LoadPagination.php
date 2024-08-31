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
use Flarum\Api\JsonApiResponse;
use Illuminate\Contracts\Container\Container;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Tobscure\JsonApi\Document;
use Tobscure\JsonApi\Parameters;
use Tobscure\JsonApi\SerializerInterface;
use Flarum\Discussion\Discussion;

class LoadPagination
{
    public function __invoke(AbstractSerializeController $controller, $data, Request $request, Document $document)
    {
        if (isset($_REQUEST['totalResultsCount'])) {
            $document->setJsonapi(['totalResultsCount' => $_REQUEST['totalResultsCount']]);
        } else if (is_object($data) && property_exists($data, 'totalResultsCount')) {
            $document->setJsonapi(['totalResultsCount' => $data->totalResultsCount]);
        }
    }
}