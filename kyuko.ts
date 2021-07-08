// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

/// <reference path='./deploy.d.ts' />

import { KyukoResponse } from "./KyukoResponse.ts";
import { RoutePathHandler } from "./RoutePathHandler.ts";

/**
 * A handler that responds to a `req (KyukoRequest)` by modifying the `res (KyukoResponse)`,
 * and finally calling `res.send()`.
 */
export type KyukoRequestHandler = (
  | ((req: KyukoRequest, res: KyukoResponse) => void)
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
  | ((req: KyukoRequest, res: KyukoResponse) => void)
  | ((req: KyukoRequest, res: KyukoResponse) => Promise<void>)
);

/**
 * Request that gets passed into a `KyukoRequestHandler`.
 * Can be extended further for middlewares to populate the original `Request`.
 */
export interface KyukoRequest extends Request {
  /**
   * Stores path parameters and their values in an object.
   */
  params: {
    [key: string]: string;
  };

  /**
   * Stores query parameters and their values.
   * Note that duplicate keys may map to different values.
   */
  query: URLSearchParams;
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
    this.#customHandlers.set("GET", new Map());
    this.#customHandlers.set("POST", new Map());
    this.#customHandlers.set("PUT", new Map());
    this.#customHandlers.set("DELETE", new Map());
    this.#customHandlers.set("PATCH", new Map());
    this.#customHandlers.set("HEAD", new Map());
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
    this.#customHandlers.get("GET")?.set(routePath, customHandler);
  }

  /**
   * Registers a `customHandler` that is invoked when
   * POST requests are made to url paths that match the `routePath`.
   */
  post(routePath: string, customHandler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get("POST")?.set(routePath, customHandler);
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
    this.#customHandlers.get("PUT")?.set(routePath, customHandler);
  }

  /**
   * Registers a `customHandler` that is invoked when
   * DELETE requests are made to url paths that match the `routePath`.
   */
  delete(routePath: string, customHandler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get("DELETE")?.set(routePath, customHandler);
  }

  /**
   * Registers a `customHandler` that is invoked when
   * PATCH requests are made to url paths that match the `routePath`.
   */
  patch(routePath: string, customHandler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get("PATCH")?.set(routePath, customHandler);
  }

  /**
   * Registers a `customHandler` that is invoked when
   * HEAD requests are made to url paths that match the `routePath`.
   *
   * example:
   *
   * ```ts
   * app.head("/", (_, res) => {
   *   res.headers.append("content-type", "text/plain;charset=UTF-8");
   *   res.headers.append("content-length", "12");
   *   res.send();
   * });
   * ```
   */
  head(routePath: string, customHandler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get("HEAD")?.set(routePath, customHandler);
  }

  /**
   * Registers a `customHandler` that is invoked when
   * any type of requests are made to url paths that match the `routePath`.
   */
  all(routePath: string, customHandler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get("GET")?.set(routePath, customHandler);
    this.#customHandlers.get("POST")?.set(routePath, customHandler);
    this.#customHandlers.get("PUT")?.set(routePath, customHandler);
    this.#customHandlers.get("DELETE")?.set(routePath, customHandler);
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
    addEventListener("fetch", this.handleFetchEvent.bind(this));
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
    req.query = new URLSearchParams();
    const res = new KyukoResponse(event);
    this.handleRequest(req, res);
  }

  private async handleRequest(req: KyukoRequest, res: KyukoResponse) {
    const { pathname, searchParams } = new URL(req.url);
    let handler: KyukoRequestHandler = this.#defaultHandler;

    // Handle routing
    const routePath = this.#routes.findMatch(pathname);
    if (routePath !== undefined) {
      const customHandlers = this.#customHandlers.get(req.method);
      if (customHandlers?.has(routePath)) {
        handler = customHandlers.get(routePath) as KyukoRequestHandler;
      }

      // Fill req.params
      req.params = RoutePathHandler.createPathParams(routePath, pathname);
    }

    // Fill req.query
    searchParams.forEach((value, key) => {
      req.query.append(key, value);
    });

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
