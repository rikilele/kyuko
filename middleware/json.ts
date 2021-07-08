import { KyukoMiddleware, KyukoRequest } from "../mod.ts";

export interface KyukoRequestWithJson extends KyukoRequest {
  // deno-lint-ignore no-explicit-any
  requestBody: any;
}

/**
 * Returns a `KyukoMiddleware` that attempts to parse the request body as JSON.
 * The parsed body is stored into `req.requestBody`.
 * Note that `req.body` will be stay unused (hence `req.bodyUsed === false`).
 *
 * example:
 *
 * ```ts
 * app.use(json());
 *
 * app.post("/", (req, res) => {
 *   const { requestBody } = req as KyukoRequestWithJson;
 * });
 * ```
 */
export function json(): KyukoMiddleware {
  return async function (req: KyukoRequest) {
    const contentType = req.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const requestClone = req.clone();
      const json = await requestClone.json();
      (req as KyukoRequestWithJson).requestBody = json;
    }
  };
}
