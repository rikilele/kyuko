// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

/// <reference path="https://deno.land/x/deploy@0.3.0/types/deploy.fetchevent.d.ts" />
/// <reference path="https://deno.land/x/deploy@0.3.0/types/deploy.ns.d.ts" />
/// <reference path="https://deno.land/x/deploy@0.3.0/types/deploy.window.d.ts" />

/**
 * The request object that is handled in Kyuko applications.
 * Can be extended further for middleware to populate the original `Request`.
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
   * Note that a single key may map to multiple different values.
   */
  query: URLSearchParams;

  /**
   * Stores the sanitized path of the request, where leading and trailing
   * slashes are stripped off accordingly.
   */
  path: string;
}

/**
 * This class is instantiated when a fetch request is captured by a Kyuko application.
 * The instance is populated by the original request handed over from the event listener.
 */
export class KyukoRequestImpl extends Request implements KyukoRequest {
  params: { [key: string]: string };
  query: URLSearchParams;
  path: string;

  /**
   * Instantiates a `KyukoRequest` based on the original `fetchEvent` request.
   * @param fetchEvent The event that this request originated from.
   */
  constructor(fetchEvent: FetchEvent) {
    super(fetchEvent.request);
    this.params = {};
    this.query = new URLSearchParams();
    this.path = "/";
  }
}
