// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

import { Kyuko } from "../mod.ts";
import { serveStatic } from "../middleware/serveStatic.ts";

/**
 * Try accessing index.html!
 */
const app = new Kyuko();
app.use(serveStatic(import.meta.url, "public"));
app.listen();
