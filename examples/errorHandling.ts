// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

import { Kyuko } from "../mod.ts";

const app = new Kyuko();

/**
 * This will handle the error thrown.
 */
app.error((err, _req, res) => {
  if (!res.wasSent()) {
    res.send(err.message);
  }
});

app.get("/", (_req, _res) => {
  throw new Error("An intentional error occurred!");
});

app.listen();
