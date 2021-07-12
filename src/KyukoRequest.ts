// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

/// <reference path="https://deno.land/x/deploy@0.3.0/types/deploy.fetchevent.d.ts" />
/// <reference path="https://deno.land/x/deploy@0.3.0/types/deploy.ns.d.ts" />
/// <reference path="https://deno.land/x/deploy@0.3.0/types/deploy.window.d.ts" />

import { v4 } from "./deps.ts";

/**
 * The request object that is handled in Kyuko applications.
 * Can be extended further for middleware to populate the original `Request`.
 */
export interface KyukoRequest extends Request {
  /**
   * A RFC4122 v4 UUID for the request.
   */
  uuid: string;
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
}

/**
 * This class is instantiated when a fetch request is captured by a Kyuko application.
 * The instance is populated by the original request handed over from the event listener.
 */
export class KyukoRequestImpl extends Request implements KyukoRequest {
  uuid: string;
  params: { [key: string]: string };
  query: URLSearchParams;

  /**
   * Instantiates a `KyukoRequest` based on the original `fetchEvent` request.
   * @param fetchEvent The event that this request originated from.
   */
  constructor(fetchEvent: FetchEvent) {
    super(fetchEvent.request);
    this.uuid = v4.generate();
    this.params = {};
    this.query = new URLSearchParams();
  }
}
