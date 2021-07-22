// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

import { contentType } from "./deps.ts";
import { KyukoMiddleware, KyukoRequest, KyukoResponse } from "../mod.ts";

/**
 * Returns a `KyukoMiddleware` that serves static assets.
 * The middleware will proxy files located under the `dir` at `url` when a
 * request is made to `path`. If you wish to serve static files that are hosted
 * alongside your source code (the Kyuko app), you should set `url` to
 * `import.meta.url`. Note that you must add a trailing slash "/" to `url` when
 * specifying a remote url other than `import.meta.main`.
 *
 * ```ts
 * // static assets placed alongside the app will be served
 * app.use(serveStatic(import.meta.url));
 * ```
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
    if (req.method === "GET" && req.path.startsWith(path)) {
      const fileName = req.path.split("/").at(-1) as string;
      const contentTypeHeader = contentType(fileName);

      // contentTypeHeader = undefined if file can't be served statically
      if (contentTypeHeader) {
        const fileUrl = new URL(dir + req.path, url);
        const file = await fetch(fileUrl);
        if (file.ok && !res.wasSent()) {
          res.headers.set("content-type", contentTypeHeader);
          res.body = file.body;
          res.status(file.status).send();
        }
      }
    }
  };
}
