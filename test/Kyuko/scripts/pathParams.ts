// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

import { Kyuko } from "../../../mod.ts";

const app = new Kyuko();

app.get("/users/:userId", (req, res) => {
  res.send(req.params.userId);
});

app.get("/users/:userId/friends/:friendId", (req, res) => {
  res.send(req.params.userId + "+" + req.params.friendId);
});

app.listen();
