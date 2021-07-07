// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

import { Kyuko } from "../mod.ts";
import { json, KyukoRequestWithJson } from "../middleware/json.ts";

const app = new Kyuko();

// Uses the `json` middleware
app.use(json);

/**
 * Responds with a pretty version of the JSON request body.
 */
app.post("/", (req, res) => {
  const { requestBody } = req as KyukoRequestWithJson;
  res.send(JSON.stringify(requestBody, null, 2));
});

app.listen();
