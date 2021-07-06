// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

/// <reference path='./deploy.d.ts' />

import { KyukoResponse } from './KyukoResponse.ts';
import { RoutePathHandler } from './RoutePathHandler.ts';

/**
 * A handler that responds to a `req (KyukoRequest)` by modifying the `res (KyukoResponse)`,
 * and finally calling `res.send()`.
 */
export type KyukoRequestHandler = (
  ((req: KyukoRequest, res: KyukoResponse) => void)
  | ((req: KyukoRequest, res: KyukoResponse) => Promise<void>)
);

// export type KyukoNextFn = VoidFunction;

// export type KyukoMiddleware = (
//   ((req: KyukoRequest, res: KyukoResponse, next: KyukoNextFn) => void)
//   | ((req: KyukoRequest, res: KyukoResponse, next: KyukoNextFn) => Promise<void>)
// );

/**
 * Request that gets passed into a `KyukoRequestHandler`.
 * Can be extended further for middlewares to populate the original `Request`.
 */
export interface KyukoRequest extends Request {
  /**
   * Stores path parameters in an object.
   */
  params: {
    [key: string]: string;
  };

  /**
   * Stores query parameters in an object.
   */
  query: {
    [key: string]: string;
  };
}

/**
 *
 */
export class Kyuko {
  #routes;
  // #middlewares: KyukoMiddleware[];
  #defaultHandler: KyukoRequestHandler;
  #customHandlers: Map<string, Map<string, KyukoRequestHandler>>;

  /**
   * Initializes a new kyuko app.
   * Supports GET, POST, PUT, DELETE routing as of now.
   */
  constructor() {
    this.#routes = new RoutePathHandler();
    // this.#middlewares = [];
    this.#defaultHandler = () => new Response(null, { status: 404 });
    this.#customHandlers = new Map();
    this.#customHandlers.set('GET', new Map());
    this.#customHandlers.set('POST', new Map());
    this.#customHandlers.set('PUT', new Map());
    this.#customHandlers.set('DELETE', new Map());
  }

  /**
   * Registers a `customHandler` that is invoked when
   * GET requests are made to url paths that match the `routePath`.
   */
  get(routePath: string, customHandler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get('GET')?.set(routePath, customHandler);
  }

  /**
   * Registers a `customHandler` that is invoked when
   * POST requests are made to url paths that match the `routePath`.
   */
  post(routePath: string, customHandler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get('POST')?.set(routePath, customHandler);
  }

  /**
   * Registers a `customHandler` that is invoked when
   * PUT requests are made to url paths that match the `routePath`.
   */
  put(routePath: string, customHandler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get('PUT')?.set(routePath, customHandler);
  }

  /**
   * Registers a `customHandler` that is invoked when
   * DELETE requests are made to url paths that match the `routePath`.
   */
  delete(routePath: string, customHandler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get('DELETE')?.set(routePath, customHandler);
  }

  /**
   * Registers a `customHandler` that is invoked when
   * any type of requests are made to url paths that match the `routePath`.
   */
  all(routePath: string, customHandler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get('GET')?.set(routePath, customHandler);
    this.#customHandlers.get('POST')?.set(routePath, customHandler);
    this.#customHandlers.get('PUT')?.set(routePath, customHandler);
    this.#customHandlers.get('DELETE')?.set(routePath, customHandler);
  }

  /**
   * Registers a default handler that is invoked when
   * a request isn't caught by any other custom handlers.
   */
  default(defaultHandler: KyukoRequestHandler) {
    this.#defaultHandler = defaultHandler;
  }

  /**
   * Starts listening to 'fetch' requests.
   * @param callback Called when server starts listening.
   */
  listen(callback?: VoidFunction) {
    addEventListener('fetch', this.handleFetchEvent.bind(this));
    callback && callback();
  }

  /**
   *
   * @param event
   */
  private handleFetchEvent(event: FetchEvent) {
    const req = event.request as KyukoRequest;
    req.params = {};
    req.query = {};
    const res = new KyukoResponse(event);
    this.handleRequest(req, res);
  }

  private handleRequest(req: KyukoRequest, res: KyukoResponse) {
    const { pathname, searchParams } = new URL(req.url);
    const routePath = this.#routes.findMatch(pathname);
    let handler: KyukoRequestHandler = this.#defaultHandler;
    if (routePath !== undefined) {
      const customHandler = this.#customHandlers.get(req.method)?.get(routePath);
      if (customHandler) {
        handler = customHandler;
      }

      req.params = this.createParamsObject(routePath, pathname);
    }

    for (const [key, value] of searchParams) {
      req.query[key] = value;
    }

    try {
      handler(req, res);
    } catch (e) {
      console.error(e);
      return new Response(null, { status: 500 });
    }
  }

  // private callMiddlewares(req: KyukoRequest, res: Response, index = 0) {
  //   if (index < this.#middlewares.length) {
  //     return this.#middlewares[index](req, res, () => {
  //       this.callMiddlewares(req, res, index + 1);
  //     });
  //   }
  // }

  private createParamsObject(routePath: string, urlPath: string) {
    const result: KyukoRequest['params'] = {};
    const routeArr = routePath.split('/');
    const urlArr = urlPath.split('/');
    routeArr.forEach((routeNode, i) => {
      const urlNode = urlArr[i];
      if (routeNode.startsWith(':')) {
        result[routeNode.substring(1)] = urlNode;
      }
    });

    return result;
  }
}
