/**
 * This class is instantiated when a fetch request is captured by a Kyuko application.
 * The instance is responsible for storing information about the response to the request.
 * The response built is finally sent out on a `send()` call.
 *
 * Note that `send()` **must** be called or else the request will hang.
 */
export class KyukoResponse {
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

  /**
   * Sets the status code to `status`, and returns `this`.
   */
  status(status: number): this {
    this.statusCode = status;
    return this;
  }

  /**
   * Sends a response to the original request that instantiated this object.
   * The response is built using the public attributes of this object,
   * which should've been set by the user beforehand.
   *
   * @param body A response body that would supersede `this.body`
   */
  send(body?: BodyInit): void {
    if (!this.#sent) {
      const response = new Response(
        body || this.body,
        {
          status: this.statusCode,
          statusText: this.statusText,
          headers: this.headers,
        }
      );

      this.#fetchEvent.respondWith(response);
      this.#sent = true;
    }
  }

  /**
   * @returns Whether the response was sent (`send()` was called) or not.
   */
  wasSent(): boolean {
    return this.#sent;
  }
}
