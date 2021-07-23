// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

/// <reference path="https://deno.land/x/deploy@0.3.0/types/deploy.fetchevent.d.ts" />
/// <reference path="https://deno.land/x/deploy@0.3.0/types/deploy.ns.d.ts" />
/// <reference path="https://deno.land/x/deploy@0.3.0/types/deploy.window.d.ts" />

import { Status, STATUS_TEXT } from "../deps.ts";

/**
 * The response object that is handled in Kyuko applications.
 * Responsible for storing information about the response to the request,
 * as well as sending the response via the `send()` and `redirect()` methods.
 *
 * Note that `send()` or `redirect()` **must** be called or else the request will hang.
 */
export interface KyukoResponse {
  body: BodyInit | null;
  statusCode: number | undefined;
  statusText: string | undefined;
  headers: Headers;

  /**
   * Sets the status code to `status`, and returns `this`.
   */
  status(status: Status): KyukoResponse;

  /**
   * Redirects the request to a new `address`.
   * The `address` can be either a relative url path, or a full url.
   * The optional `status` parameter can be used to set a custom status code.
   * Otherwise overrides the current `res.statusCode` with 302.
   *
   * @param address The address to redirect to.
   * @param status The status code of the response. Defaults to 302.
   */
  redirect(address: string, status?: number): void;

  /**
   * Sends a proper json response to the original request.
   * The json is `stringify`'d from the input JavaScript `object`.
   *
   * @param object The object to respond with.
   */
  // deno-lint-ignore no-explicit-any
  json(object: any): void;

  /**
   * Sends a response to the original request that instantiated this object.
   * The response is built using the public attributes of this object,
   * which should've been set by the user beforehand.
   *
   * @param body A response body that would supersede `this.body`
   */
  send(body?: BodyInit): void;

  /**
   * @returns Whether the response was sent (`send()` was called) or not.
   */
  wasSent(): boolean;
}

/**
 * This class is instantiated when a fetch request is captured by a Kyuko application.
 */
export class KyukoResponseImpl implements KyukoResponse {
  body: BodyInit | null;
  statusCode: number | undefined;
  statusText: string | undefined;
  headers: Headers;
  #sent: boolean;
  #fetchEvent: FetchEvent;

  /**
   * Instantiates a `KyukoResponse` based on the original `fetchEvent` request.
   * @param fetchEvent The original event that this response is responsible to respond to.
   */
  constructor(fetchEvent: FetchEvent) {
    this.body = null;
    this.statusCode = undefined;
    this.statusText = undefined;
    this.headers = new Headers();
    this.#sent = false;
    this.#fetchEvent = fetchEvent;
  }

  status(status: Status) {
    this.statusCode = status;
    const statusText = STATUS_TEXT.get(status);
    if (statusText !== undefined) {
      this.statusText = statusText;
    }

    return this;
  }

  redirect(address: string, status = 302) {
    if (this.#sent) {
      throw new Error("Can't send multiple responses to a single request");
    }

    this.status(status);
    this.headers.append("Location", encodeURI(address));
    this.send();
  }

  // deno-lint-ignore no-explicit-any
  json(object: any) {
    if (this.#sent) {
      throw new Error("Can't send multiple responses to a single request");
    }

    this.headers.append("content-type", "application/json; charset=UTF-8");
    this.send(JSON.stringify(object));
  }

  send(body?: BodyInit) {
    if (this.#sent) {
      throw new Error("Can't send multiple responses to a single request");
    }

    const response = new Response(
      body || this.body,
      {
        status: this.statusCode,
        statusText: this.statusText,
        headers: this.headers,
      },
    );

    this.#fetchEvent.respondWith(response);
    this.#sent = true;
  }

  wasSent() {
    return this.#sent;
  }
}
