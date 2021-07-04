// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.
/// <reference path='./deploy.d.ts' />

import RoutePathHandler from './RoutePathHandler.ts';

export type KyukoRequestHandler = (
  ((req: KyukoRequest) => Response)
  | ((req: KyukoRequest) => Promise<Response>)
);

export type KyukoRequest = Request & {
  params: {
    [key: string]: string;
  };

  query: {
    [key: string]: string;
  };

  requestBody: {
    [key: string]: string;
  }
};

export class Kyuko {
  #routes = new RoutePathHandler();
  #customHandlers = new Map<string, Map<string, KyukoRequestHandler>>();
  #defaultHandler: KyukoRequestHandler = () => {
    return new Response('Not Found', { status: 404 })
  };

  constructor() {
    this.#customHandlers.set('GET', new Map<string, KyukoRequestHandler>());
    this.#customHandlers.set('POST', new Map<string, KyukoRequestHandler>());
    this.#customHandlers.set('PUT', new Map<string, KyukoRequestHandler>());
    this.#customHandlers.set('DELETE', new Map<string, KyukoRequestHandler>());
  }

  /**
   * Starts listening to 'fetch' requests.
   *
   * @param cb Called when server starts listening to 'fetch' requests.
   */
  listen(cb = () => {}) {
    addEventListener('fetch', (event) => {
      const response = this.#handleRequest(event.request);
      event.respondWith(response);
    });

    cb();
  }

  /**
   * Registers a customHandler that is invoked when GET requests are made to routePath.
   */
  get(routePath: string, customHandler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get('GET')?.set(routePath, customHandler);
  }

  /**
   * Registers a customHandler that is invoked when POST requests are made to routePath.
   */
  post(routePath: string, customHandler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get('POST')?.set(routePath, customHandler);
  }

  /**
   * Registers a customHandler that is invoked when PUT requests are made to routePath.
   */
  put(routePath: string, customHandler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get('PUT')?.set(routePath, customHandler);
  }

  /**
   * Registers a customHandler that is invoked when DELETE requests are made to routePath.
   */
  delete(routePath: string, customHandler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get('DELETE')?.set(routePath, customHandler);
  }

  /**
   * Registers a customHandler that is invoked when any type of requests are made to routePath.
   */
  all(routePath: string, customHandler: KyukoRequestHandler) {
    this.#routes.addRoutePath(routePath);
    this.#customHandlers.get('GET')?.set(routePath, customHandler);
    this.#customHandlers.get('POST')?.set(routePath, customHandler);
    this.#customHandlers.get('PUT')?.set(routePath, customHandler);
    this.#customHandlers.get('DELETE')?.set(routePath, customHandler);
  }

  /**
   * Registers a default handler for requests that aren't caught by any other handlers.
   */
  default(customDefaultHandler: KyukoRequestHandler) {
    this.#defaultHandler = customDefaultHandler;
  }

  /**
   * Top-level wrapper that handles the request sent from the 'fetch' event.
   *
   * @param request The request sent from the 'fetch' event.
   * @returns A Response object, or a Promise that returns a Response object.
   */
  async #handleRequest(request: Request) {
    const { pathname, searchParams } = new URL(request.url);

    // Find the route path that corresponds to the requested url path
    const routePath = this.#routes.findMatch(pathname);

    let handler: KyukoRequestHandler = this.#defaultHandler;
    const req = request.clone() as KyukoRequest;
    req.params = {};
    req.query = {};
    req.requestBody = {};

    if (routePath !== undefined) {
      // Get handler
      const customHandler = this.#customHandlers.get(request.method)?.get(routePath);
      if (customHandler) {
        handler = customHandler;
      }

      // Put path parameters into req.params
      req.params = this.#createReqParams(routePath, pathname);
    }

    // Put query parameters into req.query
    for (const [key, value] of searchParams) {
      req.query[key] = value;
    }

    // Translate request body into req.requestBody
    const contentType = req.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const json = await req.json();
      req.requestBody = json;
    }

    return handler(req);
  }

  #createReqParams(routePath: string, urlPath: string) {
    const result: KyukoRequest['params'] = {};
    const routeArr = routePath.split('/');
    const urlArr = urlPath.split('/');
    routeArr.forEach((routeNode, i) => {
      const urlNode = urlArr[i];
      if (
        routeNode.startsWith(':')
        && routeNode !== urlNode
      ) {
        result[routeNode.substring(1)] = urlNode;
      }
    });

    return result;
  }
}
