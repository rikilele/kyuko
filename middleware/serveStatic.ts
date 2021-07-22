// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

import { contentType } from "./deps.ts";
import { KyukoMiddleware, KyukoRequest, KyukoResponse } from "../mod.ts";

/**
 * Returns a `KyukoMiddleware` that serves static assets.
 * The middleware will proxy files located under ``${url}${dir}`` when a request
 * is made to `path`. If you wish to serve static files that are hosted
 * alongside your source code (the Kyuko app), you should set `url` to
 * `import.meta.url`.
 *
 * ```ts
 * // static assets placed alongside the app will be served
 * app.use(serveStatic(import.meta.url));
 * ```
 *
 * Note that some files may not be served properly if `url` is set to external
 * addresses, mainly due to client-side resource policies.
 *
 * @param url The url that the static assets are located at.
 * @param dir The directory under the url that the static assets are located at. Default is ".".
 * @param path The root path where requests made will be served static files. Default is "/".
 * @returns The middleware.
 */
export function serveStatic(
  url: string,
  dir = ".",
  path = "/",
): KyukoMiddleware {
  return async function serveStatic(req: KyukoRequest, res: KyukoResponse) {
    if (req.path.startsWith(path)) {
      const fileName = req.path.split("/").at(-1) as string;
      const contentTypeHeader = contentType(fileName);

      // contentTypeHeader = undefined if requested file can't be served
      if (contentTypeHeader) {
        const fileUrl = new URL(`${dir}${req.path}`, url);
        const file = await fetch(fileUrl);
        if (file.ok && !res.wasSent()) {
          // Set content-type header
          res.headers = new Headers(file.headers);
          res.headers.set("content-type", contentTypeHeader);

          // Set body and send
          res.body = file.body;
          res.status(file.status).send();
        }
      }
    }
  };
}
