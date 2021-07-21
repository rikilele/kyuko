// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

import { Kyuko } from "../mod.ts";
import { decodeParams } from "../middleware/decodeParams.ts";
import { json, WithBody } from "../middleware/json.ts";

const app = new Kyuko();

/**
 * Logs the rough response time for each request.
 * For example purposes only!
 */
let id = 0;
app.use((req, _res, defer) => {
  const unique = `${id++} ${req.path}`;
  console.time(unique);
  defer(() => {
    console.timeEnd(unique);
  });
});

app.use(decodeParams());
app.use(json());

/**
 * Try accessing encoded url paths such as "/Alice%20%26%20Bob".
 */
app.get("/:name", (req, res) => {
  res.send(`Hello ${req.params.name}!`);
});

/**
 * Responds with a pretty version of the JSON request body.
 */
app.post("/", (req, res) => {
  const { requestBody } = req as WithBody;
  res.send(JSON.stringify(requestBody, null, 2));
});

app.listen();
