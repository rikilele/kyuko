// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

import { Kyuko } from "../../../mod.ts";

const app = new Kyuko();

app.get("/", (_, res) => {
  res.send("Hello World!");
});

app.listen();
