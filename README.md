[![ci](https://github.com/rikilele/kyuko/actions/workflows/ci.yml/badge.svg)](https://github.com/rikilele/kyuko/actions/workflows/ci.yml)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/rikilele/kyuko)](https://github.com/rikilele/kyuko/releases)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/kyuko/mod.ts)

> Fast and easy http framework for Deno Deploy 🦕

Kyuko is an ultra-light http framework for apps hosted on
[Deno Deploy](https://deno.com/deploy).

It aims to provide developers with a similar experience to developing http
servers with [Express](https://expressjs.com/),
[hence its name](https://translate.google.com/?sl=ja&tl=en&text=%E6%80%A5%E8%A1%8C&op=translate&hl=en).

Read the [design philosophy](#design-philosophy) to learn more about the apps
Kyuko serves well.

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

# Design Philosophy

Kyuko is an http framework for Deno Deploy that aims to be **`fast`** and
**`easy`**.

### Fast

Kyuko allows developers to focus on delivering value without having to worry
about performance issues caused by the framework. It achieves this by providing
the bare minimum functionality of an http framework: routing, application-level
middleware, and error handling. By focusing on what is only absolutely
necessary, Kyuko powers apps that are **`fast`** by default.

### Easy

Apps that are hosted on Deno Deploy are assumed to be simple with specific
purposes. These apps often just require light-weight http frameworks that would
handle common tasks, while leaving freedom for customization. Kyuko offers a set
of functionality that is light and well-documented, saving developers from
having to guess what is happening from outside a black box. Predictability makes
Kyuko a framework that is extremely **`easy`** to adopt.
