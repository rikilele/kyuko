import { KyukoMiddleware, KyukoRequest } from "../mod.ts";

/**
 * An extension of `KyukoRequest` that can be used with the `json` middleware.
 * The generic `T` can be supplied to assist with request body type checking.
 *
 * ```ts
 * interface UserSchema {
 *   firstName: string;
 *   middleName: string;
 *   lastName: string;
 *   age: number;
 * }
 *
 * app.use(json());
 *
 * app.post("/", (req, res) => {
 *   const { requestBody } = req as WithBody<UserSchema>;
 *   // use req.firstName,...
 * });
 * ```
 */
export interface WithBody<T = unknown> extends KyukoRequest {
  requestBody: T;
}

/**
 * Returns a `KyukoMiddleware` that attempts to parse the request body as JSON.
 * The parsed body is stored into `req.requestBody`.
 * Note that `req.body` will be stay unused (hence `req.bodyUsed === false`).
 */
export function json(): KyukoMiddleware {
  return async function json(req: KyukoRequest) {
    const contentType = req.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const requestClone = req.clone();
      const json = await requestClone.json();
      (req as WithBody).requestBody = json;
    }
  };
}
