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

/**
 * A function that has access to the `req` and `res` objects,
 * and return early by calling `res.send()` when needed.
 * Hands over execution to the next middleware / request handler on return.
 *
 * Notice how a `next()` call is unneeded.
 */
export type KyukoMiddleware = (
  ((req: KyukoRequest, res: KyukoResponse) => void)
  | ((req: KyukoRequest, res: KyukoResponse) => Promise<void>)
);

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
 * An ultra-light framework for API servers hosted on [Deno Deploy](https://deno.com/deploy).
 * Aims to provide a similar experience to developing API servers with [Express](https://expressjs.com/).
 */
export class Kyuko {
  #routes;
  #middlewares: KyukoMiddleware[];
  #defaultHandler: KyukoRequestHandler;
  #customHandlers: Map<string, Map<string, KyukoRequestHandler>>;

  /**
   * Initializes a new Kyuko app.
   * Supports routing for GET, POST, PUT, DELETE methods as of now.
   */
  constructor() {
    this.#routes = new RoutePathHandler();
    this.#middlewares = [];
    this.#defaultHandler = (_, res) => res.status(404).send();
    this.#customHandlers = new Map();
    this.#customHandlers.set('GET', new Map());
    this.#customHandlers.set('POST', new Map());
    this.#customHandlers.set('PUT', new Map());
    this.#customHandlers.set('DELETE', new Map());
  }

  /**
   * Registers a `customHandler` that is invoked when
   * GET requests are made to url paths that match the `routePath`.
   *
   * example:
   *
   * ```ts
   * app.get('/', (req, res) => {
   *   const { name } = req.query;
   *   res.send(`Hello ${name}!`);
   * });
   * ```
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
   *
   * example:
   *
   * ```ts
   * app.put('/users/:id', (req, res) => {
   *   const { id } = req.params;
   *
   *   // ...
   *
   *   res.status(204).send(`Updated ${id}!`);
   * });
   * ```
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
   * Adds `middleware` to the list of application-level middlewares to run.
   * @param middleware
   */
  use(middleware: KyukoMiddleware) {
    this.#middlewares.push(middleware);
  }

  private handleFetchEvent(event: FetchEvent) {
    const req = event.request as KyukoRequest;
    req.params = {};
    req.query = {};
    const res = new KyukoResponse(event);
    this.handleRequest(req, res);
  }

  private async handleRequest(req: KyukoRequest, res: KyukoResponse) {
    const { pathname, searchParams } = new URL(req.url);
    const routePath = this.#routes.findMatch(pathname);
    let handler: KyukoRequestHandler = this.#defaultHandler;
    if (routePath !== undefined) {
      const customHandler = this.#customHandlers.get(req.method)?.get(routePath);
      if (customHandler) {
        handler = customHandler;
      }

      req.params = RoutePathHandler.createPathParams(routePath, pathname);
    }

    for (const [key, value] of searchParams) {
      req.query[key] = value;
    }

    try {
      const needsFinalHandling = await this.runMiddlewares(req, res);
      if (needsFinalHandling) {
        handler(req, res);
      }
    } catch (e) {
      console.error(e);
      res.status(500).send();
    }
  }

  /**
   * @returns `true` if middlewares ran until completion. `false` if responded early.
   */
  private async runMiddlewares(req: KyukoRequest, res: KyukoResponse) {
    for (const middleware of this.#middlewares) {
      await middleware(req, res);
      if (res.wasSent()) {
        return false;
      }
    }

    return true;
  }
}
