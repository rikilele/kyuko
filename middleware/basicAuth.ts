// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

import { KyukoMiddleware, KyukoRequest, KyukoResponse } from "../mod.ts";

/**
 * An extension of `KyukoRequest` that can be used with the `basicAuth` middleware.
 * Adds authentication information onto the request object.
 *
 * ```ts
 * app.use(basicAuth(authenticator));
 *
 * app.get("/secret", (req, res) => {
 *   const { authenticated } = (req as WithBasicAuth).basicAuth;
 *   if (authenticated) {
 *     res.send("a secret message");
 *   }
 *
 *   // ...
 * });
 * ```
 */
export interface WithBasicAuth extends KyukoRequest {
  basicAuth: {
    realm: string;
    authenticated: boolean;

    /**
     * The username of the authenticated user.
     */
    user: string | undefined;
  };
}

/**
 * A function that returns `true` if the username and password are valid.
 */
export type Authenticator = (
  | ((username: string, password: string) => boolean)
  | ((username: string, password: string) => Promise<boolean>)
);

/**
 * Returns a `KyukoMiddleware` that handles basic authentication.
 * The result of authentication is stored in `req.basicAuth`.
 * See [RFC7617](https://datatracker.ietf.org/doc/html/rfc7617) for more information.
 *
 * @param authenticator Authenticates the username and password supplied by the middleware.
 * @param realm Defines a "protection space" that can be informed to clients.
 * @param sendResponse Whether to automatically send a `401 Unauthorized` response on failed authentication.
 */
export function basicAuth(
  authenticator: Authenticator,
  realm = "Access to app",
  sendResponse = false,
): KyukoMiddleware {
  return async function (req: KyukoRequest, res: KyukoResponse) {
    const _req = req as WithBasicAuth;
    _req.basicAuth = {
      realm,
      authenticated: false,
      user: undefined,
    };

    const h = _req.headers.get("authorization");
    if (!h?.startsWith("Basic ")) {
      return sendResponse && unauthenticated(_req, res);
    }

    const [username, password] = (h as string).substr(6).split(":").map(atob);
    if (!await authenticator(username, password)) {
      return sendResponse && unauthenticated(_req, res);
    }

    _req.basicAuth.authenticated = true;
    _req.basicAuth.user = username;
  };
}

function unauthenticated(req: WithBasicAuth, res: KyukoResponse) {
  if (!res.wasSent()) {
    const { realm } = req.basicAuth;
    res.headers.append("WWW-Authenticate", `Basic: realm="${realm}"`);
    res.headers.append("WWW-Authenticate", 'charset="UTF-8"');
    res.status(401).send();
  }
}
