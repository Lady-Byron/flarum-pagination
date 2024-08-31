<?php

/*
 * This file is part of foskym/flarum-pagination.
 *
 * Copyright (c) 2024 FoskyM.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace FoskyM\Pagination\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Flarum\Http\RequestUtil;
use Laminas\Diactoros\Response\JsonResponse;

class PaginationMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandlerInterface $handler): Response
    {
        $settings = app('flarum.settings');

        $actor = RequestUtil::getActor($request);
        $queryParams = $request->getQueryParams();
        $offset = $queryParams['page']['offset'] ?? 0;
        $limit = $queryParams['page']['limit'] ?? 20;

        if ($settings->get('foskym-pagination.paginationOnLoading')) {
            $perPage = $settings->get('foskym-pagination.perPage') ?? 20;
            if ($limit != $perPage && $limit === 20) {
                $queryParams['page']['limit'] = $perPage;
                $request = $request->withQueryParams($queryParams);
            }
        } else {
            $perIndexInit = $settings->get('foskym-pagination.perIndexInit') ?? 20;
            if ($limit != $perIndexInit && $limit === 20) {
                $queryParams['page']['limit'] = $perIndexInit;
                $request = $request->withQueryParams($queryParams);
            }
        }
        return $handler->handle($request);
    }
}