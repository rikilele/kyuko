[![ci](https://github.com/rikilele/kyuko/actions/workflows/ci.yml/badge.svg)](https://github.com/rikilele/kyuko/actions/workflows/ci.yml)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/rikilele/kyuko)](https://github.com/rikilele/kyuko/releases)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/kyuko/mod.ts)

> Fast and easy http framework for Deno Deploy 🦕

Kyuko is an ultra-light http framework for apps hosted on
[Deno Deploy](https://deno.com/deploy).

It aims to provide developers with a similar experience to using
[Express](https://expressjs.com/),
[hence its name](https://translate.google.com/?sl=ja&tl=en&text=%E6%80%A5%E8%A1%8C&op=translate&hl=en).

**Table of Contents**

- [Hello World](#hello-world) and [Usage](#usage) to get started quickly
- [Philosophy](#philosophy) to learn more about the apps Kyuko serves well
- [Guide](#guide) to read an in-depth introduction on how to use Kyuko

# Hello World

Deployed at https://kyuko.deno.dev

```js
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

# Philosophy

Kyuko is an http framework for Deno Deploy that aims to be **`fast`** and
**`easy`**.

### Fast

Kyuko provides the bare minimum functionality of an http framework: routing,
application-level middleware, and error handling. By focusing on what is only
absolutely necessary, Kyuko powers apps that are **`fast`** by default.

### Easy

Kyuko offers a set of functionality that is light and well-documented, saving
developers from having to guess what is happening from outside a black box.
Predictability makes Kyuko a framework that is extremely **`easy`** to adopt.

# Guide

For the API reference, visit the Kyuko
[Deno Doc](https://doc.deno.land/https/deno.land/x/kyuko/mod.ts).

## Table of Contents

1. [Routing](#routing)
1. [Middleware](#middleware)
1. [Error Handling](#error-handling)
1. [Event Lifecycle](#event-lifecycle)

## Routing

From [Express](https://expressjs.com/en/starter/basic-routing.html):

> **_Routing_** refers to determining how an application responds to a client
> request to a particular endpoint, which is [a path] and a specific HTTP
> request method (GET, POST, and so on).

Kyuko allows developers to register a route handler to a route path in the
following manner:

```js
app.METHOD(PATH, HANDLER);
```

Where:

- `app` is an instance of
  [`Kyuko`](https://doc.deno.land/https/deno.land/x/kyuko/mod.ts#Kyuko)
- `METHOD` is an http request method in lowercase
- `PATH` is a valid [route path](#route-paths)
- `HANDLER` is the
  [`KyukoRouteHandler`](https://doc.deno.land/https/deno.land/x/kyuko/mod.ts#KyukoRouteHandler)
  executed when the route is matched

Only a single route handler is registered for a specific route path. When
multiple handlers are registered under the same route path via `app.METHOD()`,
the last route handler will be registered.

### Route Paths

Route paths define endpoints at which requests can be made. They consist of
segments that can either be concrete or a wildcard. In the following example,
`users` is a concrete segment, while `:userId` is a wildcard segment. The
example will handle GET requests that are sent to `"/users/Alice"`, but not
requests that are sent to `"/"`, `"/users"`, `"/users/Alice/friends"`, etc.

```js
app.get("/users/:userId", (req, res) => {
  const { userId } = req.params;
  res.send(`Hello ${userId}!`);
});
```

Response:

```
Hello Alice!
```

Kyuko only officially supports route paths that consist of
[unreserved characters](https://datatracker.ietf.org/doc/html/rfc3986#section-2.3).
The behavior for when a route path consisting of other characters is registered
is undefined.

### Slashes in Paths

- Recurring leading slashes will be merged and considered as one slash
- Recurring slashes that appear mid-path will contribute to empty paths
- A single trailing slash will be ignored

For more detail, refer to
[RFC3986](https://datatracker.ietf.org/doc/html/rfc3986).

**[↑ back to top](#guide)**

## Middleware

Kyuko allows developers to register application-level middleware in the
following manner:

```js
app.use(MIDDLEWARE);
```

Where:

- `app` is an instance of
  [`Kyuko`](https://doc.deno.land/https/deno.land/x/kyuko/mod.ts#Kyuko)
- `MIDDLEWARE` is the
  [`KyukoMiddleware`](https://doc.deno.land/https/deno.land/x/kyuko/mod.ts#KyukoMiddleware)
  that is run on each request

Multiple middleware can be registered on a Kyuko application. Middleware are
always called in order of registration, and will all run until completion unless
an error is thrown.

Middleware functions can perform the following tasks:

- Execute any code
- Make changes to the request and response objects
- Send a response
- Defer logic until after route handling

### Sending Responses

Take note of the following points when choosing to send responses in middleware:

1. Check `res.wasSent()` beforehand to make sure that no other middleware have
   sent a response already
1. The route handler that was assigned to the request **will not run** if a
   middleware responds early

**[↑ back to top](#guide)**

## Error Handling

Kyuko allows developers to register application-level error handlers in the
following manner:

```js
app.error(HANDLER);
```

Where:

- `app` is an instance of
  [`Kyuko`](https://doc.deno.land/https/deno.land/x/kyuko/mod.ts#Kyuko)
- `HANDLER` is the
  [`KyukoErrorHandler`](https://doc.deno.land/https/deno.land/x/kyuko/mod.ts#KyukoErrorHandler)
  that is run when errors are thrown

Like middleware, multiple error handlers can be registered on a Kyuko
application. Error handlers are called when an error is thrown during execution
of middleware or a route handler. Error handlers are called in order of
registration, and will all run until completion unless an error is thrown from
the error handlers.

Error handlers can perform the following tasks:

- Execute any code
- Make changes to the error, request, and response objects
- Send a response

### Sending Responses

Check `res.wasSent()` before sending a response from an error handler to make
sure that a response wasn't sent already.

**[↑ back to top](#guide)**

## Event Lifecycle

Here is a very simple Deno Deploy script:

```js
addEventListener("fetch", (event) => {
  const response = new Response("Hello World!");
  event.respondWith(response);
});
```

As shown, a simple Deno Deploy script essentially receives fetch events, and
creates responses to respond with.

Kyuko adds routing, middleware, and error handling to the event lifecycle. Here
are the specific steps taken, when an event is first received until the event is
responded to within a Kyuko app:

---

1. **`[SETUP]` Extraction of request information**

   The `req` object is created from the `event` received. The url path of the
   request is also extracted from the request information, for use in the next
   step.

1. **`[ROUTING]` Finding a route handler**

   A registered route path is matched from the request url path, and is used to
   determine the route handler. If no registered route paths match the request
   url path, a default handler that returns a 404 Not Found is selected to
   handle the request. A custom default handler can be registered via
   `app.default()`.

   > Note: only **one** route handler is chosen for each request.

1. **`[SETUP`] Creation of `req.params` and `req.query`**

   If a registered route path was found, the `req.params` object is populated to
   contain pairs of wildcard segments to corresponding url path segments.

1. **`[MIDDLEWARE]` Running middleware**

   Middleware registered via `app.use()` are run in this step. The middleware
   are given access to the `req` and `res` objects, and are free to modify them
   as needed. All middleware will run in order of registration and until
   completion, unless an error is thrown.

   Middleware also can choose to `defer()` logic until after the
   `[ROUTE HANDLING]` step is completed.

   A middleware can choose to respond early to an event by calling `res.send()`,
   `res.redirect()`, etc. In that case, the `[ROUTE HANDLING]` step will not be
   taken, and skips over to the `[DEFERRED HANDLERS]` step.

1. **`[ROUTE HANDLING]` Running the route handler**

   The **one** route handler that was chosen in the `[ROUTING]` step will be
   executed in this step. The route handler will not run however, if

   - A middleware chose to respond early
   - A middleware threw an error AND the error handler responded early

1. **`[DEFERRED HANDLERS]` Runs deferred handlers**

   Logic that is deferred in the `[MIDDLEWARE]` are run in this step. The logic
   will be handled LIFO, and will all run until completion unless an error is
   thrown. A deferred logic can also choose to respond (late) to the request.

1. **`[ERROR HANDLING]` Handling errors**

   This step is run only if an error was thrown during the `[MIDDLEWARE]`,
   `[ROUTE HANDLING]`, or `[DEFERRED HANDLERS]` steps. Error handlers registered
   via `app.error()` are run in order of registration and until completion. They
   are given access to the `err` thrown and the `req` and `res` objects, and are
   free to modify them as needed.

   Error handlers can choose to respond to the request by calling `res.send()`,
   `res.redirect()`, etc. If not, a 500 Internal Server Error is used as a
   default response.

---

**[↑ back to top](#guide)**
