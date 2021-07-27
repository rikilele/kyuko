// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

import { Kyuko } from "../../../mod.ts";

const app = new Kyuko();

app.get("/", (req, res) => {
  res.send(req.query.toString());
});

app.listen();
