// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

/// <reference path='./deploy.d.ts' />

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
}

/**
 * This class is instantiated when a fetch request is captured by a Kyuko application.
 * The instance is populated by the original request handed over from the event listener.
 */
export class KyukoRequestImpl extends Request implements KyukoRequest {
  params: { [key: string]: string };
  query: URLSearchParams;

  /**
   * Instantiates a `KyukoRequest` based on the original `fetchEvent` request.
   * @param fetchEvent The event that this request originated from.
   */
  constructor(fetchEvent: FetchEvent) {
    super(fetchEvent.request);
    this.params = {};
    this.query = new URLSearchParams();
  }
}