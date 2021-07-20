// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

/// <reference path="https://deno.land/x/deploy@0.3.0/types/deploy.fetchevent.d.ts" />
/// <reference path="https://deno.land/x/deploy@0.3.0/types/deploy.ns.d.ts" />
/// <reference path="https://deno.land/x/deploy@0.3.0/types/deploy.window.d.ts" />

import { brightRed } from "./deps.ts";
import { KyukoRequest, KyukoRequestImpl } from "./KyukoRequest.ts";
import { KyukoResponse, KyukoResponseImpl } from "./KyukoResponse.ts";
import { RoutePathHandler } from "./RoutePathHandler.ts";

/**
 * A function that is invoked in response to fetch requests.
 * Runs after all middleware functions have been called.
 */
export type KyukoRouteHandler = (
  req: KyukoRequest,
  res: KyukoResponse,
) => Promise<unknown> | unknown;

/**
 * A function that is invoked before the route handler is called.
 * Hands over execution to the next middleware / route handler on return.
 */
export type KyukoMiddleware = (
  req: KyukoRequest,
  res: KyukoResponse,
) => Promise<unknown> | unknown;

/**
 * A function that is invoked when errors are thrown within the Kyuko app.
 * Has access to the `err` object as well as the `req` and `res` objects.
 * Hands over execution to the next error handler on return.
 */
export type KyukoErrorHandler = (
  err: Error,
  req: KyukoRequest,
  res: KyukoResponse,
) => Promise<unknown> | unknown;

/**
 * An ultra-light framework for http servers hosted on [Deno Deploy](https://deno.com/deploy).
 * Visit the [guide](https://github.com/rikilele/kyuko#guide) for more information.
 */
export class Kyuko {
  #routes;
  #middleware: KyukoMiddleware[];
  #errorHandlers: KyukoErrorHandler[];
  #defaultHandler: KyukoRouteHandler;
  #customHandlers: Map<string, Map<string, KyukoRouteHandler>>;

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
  get(routePath: string, handler: KyukoRouteHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get("GET")?.set(routePath, handler);
  }

  /**
   * Registers a `handler` that is invoked when
   * POST requests are made to url paths that match the `routePath`.
   */
  post(routePath: string, handler: KyukoRouteHandler) {
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
  put(routePath: string, handler: KyukoRouteHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get("PUT")?.set(routePath, handler);
  }

  /**
   * Registers a `handler` that is invoked when
   * DELETE requests are made to url paths that match the `routePath`.
   */
  delete(routePath: string, handler: KyukoRouteHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get("DELETE")?.set(routePath, handler);
  }

  /**
   * Registers a `handler` that is invoked when
   * PATCH requests are made to url paths that match the `routePath`.
   */
  patch(routePath: string, handler: KyukoRouteHandler) {
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
  head(routePath: string, handler: KyukoRouteHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get("HEAD")?.set(routePath, handler);
  }

  /**
   * Registers a `handler` that is invoked when
   * any type of requests are made to url paths that match the `routePath`.
   */
  all(routePath: string, handler: KyukoRouteHandler) {
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
  default(handler: KyukoRouteHandler) {
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
    const { pathname, searchParams } = new URL(req.url);

    // Handle routing
    let routeHandler: KyukoRouteHandler = this.#defaultHandler;
    const routePath = this.#routes.findMatch(pathname);
    if (routePath !== undefined) {
      const customHandlers = this.#customHandlers.get(req.method);
      if (customHandlers?.has(routePath)) {
        routeHandler = customHandlers.get(routePath) as KyukoRouteHandler;
      }

      // Fill req.params
      req.params = RoutePathHandler.createPathParams(routePath, pathname);
    }

    // Fill req.query
    searchParams.forEach((value, key) => {
      req.query.append(key, value);
    });

    this.invokeHandlers(req, res, routeHandler);
  }

  private async invokeHandlers(
    req: KyukoRequest,
    res: KyukoResponse,
    routeHandler: KyukoRouteHandler,
  ) {
    // Run middleware
    try {
      for (const middleware of this.#middleware) {
        await middleware(req, res);
      }
    } catch (err) {
      console.error(brightRed("Error in KyukoMiddleware:"));
      console.error(err);
      this.handleError(err, req, res);
    }

    // Run route handler
    try {
      if (!res.wasSent()) {
        await routeHandler(req, res);
      }
    } catch (err) {
      console.error(brightRed("Error in KyukoRouteHandler:"));
      console.error(err);
      this.handleError(err, req, res);
    }
  }

  private async handleError(err: Error, req: KyukoRequest, res: KyukoResponse) {
    try {
      for (const errorHandler of this.#errorHandlers) {
        await errorHandler(err, req, res);
      }
    } catch (ohShit) {
      console.error(brightRed("Error in KyukoErrorHandler:"));
      console.error(ohShit);
    }

    if (!res.wasSent()) {
      res.status(500).send();
    }
  }
}
