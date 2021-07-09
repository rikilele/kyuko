[![ci](https://github.com/rikilele/kyuko/actions/workflows/ci.yml/badge.svg)](https://github.com/rikilele/kyuko/actions/workflows/ci.yml)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/rikilele/kyuko)](https://github.com/rikilele/kyuko/releases)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/kyuko/mod.ts)

> Fast, unopinionated, minimalist web framework for Deno Deploy 🦕

Kyuko is an ultra-light framework for API servers hosted on
[Deno Deploy](https://deno.com/deploy).

It aims to provide a similar experience to developing API servers with
[Express](https://expressjs.com/),
[hence its name](https://translate.google.com/?sl=ja&tl=en&text=%E6%80%A5%E8%A1%8C&op=translate&hl=en).

# Hello World

Deployed at https://kyuko.deno.dev

```ts
import { Kyuko } from "https://deno.land/x/kyuko/mod.ts";

const app = new Kyuko();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/:name", (req, res) => {
  res.send(`Hello ${req.params.name}!`);
});

app.listen();
```

# Usage

To run your Kyuko app locally using `deployctl`:

```sh
deployctl run --libs="" your_kyuko_app.ts
```
