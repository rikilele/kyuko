// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

import { KyukoMiddleware, KyukoRequest } from "../mod.ts";

/**
 * Returns a `KyukoMiddleware` that decodes the values of `req.params`.
 */
export function decodeParams(): KyukoMiddleware {
  return function decodeParams(req: KyukoRequest) {
    Object.keys(req.params).forEach((param) => {
      const encoded = req.params[param];
      req.params[param] = decodeURIComponent(encoded);
    });
  };
}
