// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

/// <reference path="https://raw.githubusercontent.com/denoland/deployctl/main/types/deploy.fetchevent.d.ts" />
/// <reference path="https://raw.githubusercontent.com/denoland/deployctl/main/types/deploy.ns.d.ts" />
/// <reference path="https://raw.githubusercontent.com/denoland/deployctl/main/types/deploy.window.d.ts" />

import { brightRed } from "./deps.ts";
import { KyukoRequest, KyukoRequestImpl } from "./KyukoRequest.ts";
import { KyukoResponse, KyukoResponseImpl } from "./KyukoResponse.ts";
import { RoutePathHandler } from "./RoutePathHandler.ts";

/**
 * A function that is invoked in response to fetch requests.
 * Runs after all middleware functions have been called.
 */
export type KyukoRequestHandler = (
  | ((req: KyukoRequest, res: KyukoResponse) => void)
  | ((req: KyukoRequest, res: KyukoResponse) => Promise<void>)
);

/**
 * A function that is invoked before the request handler is called.
 * Hands over execution to the next middleware / request handler on return.
 */
export type KyukoMiddleware = (
  | ((req: KyukoRequest, res: KyukoResponse) => void)
  | ((req: KyukoRequest, res: KyukoResponse) => Promise<void>)
);

/**
 * A function that is invoked when errors are thrown within the Kyuko app.
 * Has access to the `err` object as well as the `req` and `res` objects.
 * Hands over execution to the next error handler on return.
 */
export type KyukoErrorHandler = (
  | ((err: Error, req: KyukoRequest, res: KyukoResponse) => void)
  | ((err: Error, req: KyukoRequest, res: KyukoResponse) => Promise<void>)
);

/**
 * An ultra-light framework for API servers hosted on [Deno Deploy](https://deno.com/deploy).
 * Aims to provide a similar experience to developing API servers with [Express](https://expressjs.com/).
 *
 *
 * **Route methods**
 *
 * Kyuko currently supports the following HTTP methods:
 *
 * <ul>
 *   <li>GET</li>
 *   <li>POST</li>
 *   <li>PUT</li>
 *   <li>DELETE</li>
 *   <li>PATCH</li>
 *   <li>HEAD</li>
 * </ul>
 *
 *
 * **Route paths**
 *
 * Route paths define endpoints at which requests can be made.
 * Kyuko internally uses the
 * [`URL.pathname`](https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname)
 * property to match url paths with route paths.
 * Route paths consist of segments that can either be concrete or a wildcard.
 * In the following example, `users` is a concrete segment, while `:userId` is a wildcard segment.
 * The example will handle requests that are sent to `"/users/Alice"`, `"/users/Bob"`, etc.
 *
 * ```ts
 * app.get("/users/:userId", (req, res) => {
 *   const { userId } = req.params;
 *   res.send(`Hello ${userId}!`);
 * });
 * ```
 *
 * Kyuko only officially supports route paths that consist of unreserved characters
 * [RFC3986 section 2.3](https://datatracker.ietf.org/doc/html/rfc3986#section-2.3).
 * The behavior for when a route path consisting of other characters is registered is undefined.
 *
 *
 * Note on handling of slashes in paths:
 *
 * <ul>
 *   <li>Recurring leading slashes will be merged and considered as one slash</li>
 *   <li>Recurring slashes that appear mid-path will contribute to empty paths</li>
 *   <li>A single trailing slash will be ignored</li>
 * </ul>
 *
 * For more details, refer to [RFC3986](https://datatracker.ietf.org/doc/html/rfc3986).
 */
export class Kyuko {
  #routes;
  #middleware: KyukoMiddleware[];
  #errorHandlers: KyukoErrorHandler[];
  #defaultHandler: KyukoRequestHandler;
  #customHandlers: Map<string, Map<string, KyukoRequestHandler>>;

  /**
   * Initializes a new Kyuko app.
   */
  constructor() {
    this.#routes = new RoutePathHandler();
    this.#middleware = [];
    this.#errorHandlers = [];
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
   * Registers a `handler` that is invoked when
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
  get(routePath: string, handler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get("GET")?.set(routePath, handler);
  }

  /**
   * Registers a `handler` that is invoked when
   * POST requests are made to url paths that match the `routePath`.
   */
  post(routePath: string, handler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get("POST")?.set(routePath, handler);
  }

  /**
   * Registers a `handler` that is invoked when
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
  put(routePath: string, handler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get("PUT")?.set(routePath, handler);
  }

  /**
   * Registers a `handler` that is invoked when
   * DELETE requests are made to url paths that match the `routePath`.
   */
  delete(routePath: string, handler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get("DELETE")?.set(routePath, handler);
  }

  /**
   * Registers a `handler` that is invoked when
   * PATCH requests are made to url paths that match the `routePath`.
   */
  patch(routePath: string, handler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get("PATCH")?.set(routePath, handler);
  }

  /**
   * Registers a `handler` that is invoked when
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
  head(routePath: string, handler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get("HEAD")?.set(routePath, handler);
  }

  /**
   * Registers a `handler` that is invoked when
   * any type of requests are made to url paths that match the `routePath`.
   */
  all(routePath: string, handler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get("GET")?.set(routePath, handler);
    this.#customHandlers.get("POST")?.set(routePath, handler);
    this.#customHandlers.get("PUT")?.set(routePath, handler);
    this.#customHandlers.get("DELETE")?.set(routePath, handler);
  }

  /**
   * Registers a default `handler` that is invoked when
   * a request isn't caught by any other custom handlers.
   */
  default(handler: KyukoRequestHandler) {
    this.#defaultHandler = handler;
  }

  /**
   * Adds `middleware` to a list of application-level middleware to run.
   * Middleware are invoked in order of addition via `use()`.
   */
  use(middleware: KyukoMiddleware) {
    this.#middleware.push(middleware);
  }

  /**
   * Adds `errorHandler` to a list of application-level error handlers.
   * Error handlers are invoked in order of addition via `error()`.
   *
   * > Note that in Express, you call `use()` instead.
   */
  error(errorHandler: KyukoErrorHandler) {
    this.#errorHandlers.push(errorHandler);
  }

  /**
   * Starts listening to 'fetch' requests.
   * @param callback Called when server starts listening.
   */
  listen(callback?: VoidFunction) {
    addEventListener("fetch", this.handleFetchEvent.bind(this));
    callback && callback();
  }

  private handleFetchEvent(event: FetchEvent) {
    const req = new KyukoRequestImpl(event);
    const res = new KyukoResponseImpl(event);
    this.handleRequest(req, res);
  }

  private handleRequest(req: KyukoRequest, res: KyukoResponse) {
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

    this.invokeHandlers(req, res, handler);
  }

  private async invokeHandlers(
    req: KyukoRequest,
    res: KyukoResponse,
    handler: KyukoRequestHandler,
  ) {
    // Run middleware and request handler
    try {
      for (const middleware of this.#middleware) {
        await middleware(req, res);
      }

      handler(req, res);

      // Catch error from middleware OR request handler
    } catch (err1) {
      console.error(
        brightRed(
          "Error thrown when calling a KyukoMiddleware / KyukoRequestHandler:",
        ),
      );
      console.error(err1);

      // Run error handlers
      try {
        for (const errorHandler of this.#errorHandlers) {
          await errorHandler(err1, req, res);
        }

        // Catch error from error handler
      } catch (err2) {
        console.error(
          brightRed("Error thrown when calling a KyukoErrorHandler:"),
        );
        console.error(err2);
      }

      if (!res.wasSent()) {
        res.status(500).send();
      }
    }
  }
}
