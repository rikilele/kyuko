/**
 * This class is instantiated when a fetch request is captured by a Kyuko application.
 * The instance is responsible for storing information about the response to the request.
 * The response built is finally sent out on a `send()` call.
 *
 * Note that `send()` **must** be called or else the request will hang.
 */
export class KyukoResponse {
  body: BodyInit | null;
  status: number | undefined;
  statusText: string | undefined;
  headers: Headers;
  #fetchEvent: FetchEvent;

  /**
   * Instantiates a `KyukoResponse` based on the original `fetchEvent` request.
   * @param fetchEvent The original event that this response is responsible to respond to.
   */
  constructor(fetchEvent: FetchEvent) {
    this.body = null;
    this.status = undefined;
    this.statusText = undefined;
    this.headers = new Headers();
    this.#fetchEvent = fetchEvent;
  }

  /**
   * Sends a response to the original request that instantiated this object.
   * The response is built using the public attributes of this object,
   * which should've been set by the user beforehand.
   *
   * @param body A response body that would supersede `this.body`
   */
  send(body?: BodyInit) {
    const response = new Response(
      body || this.body,
      {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      }
    );

    this.#fetchEvent.respondWith(response);
  }
}
