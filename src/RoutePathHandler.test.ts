// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

import { assertEquals } from "./dev_deps.ts";
import { RoutePathHandler } from "./RoutePathHandler.ts";

Deno.test("empty handler", () => {
  const pathHandler = new RoutePathHandler();
  assertEquals(pathHandler.findMatch("/"), undefined);
  assertEquals(pathHandler.findMatch("/users"), undefined);
  assertEquals(pathHandler.findMatch("/users/Alice"), undefined);
  assertEquals(pathHandler.findMatch("/users/Alice/friends"), undefined);
  assertEquals(pathHandler.findMatch("/users/Alice/friends/Bob"), undefined);
});

Deno.test("handler handles /", () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath("/");
  pathHandler.addRoutePath("/users");
  pathHandler.addRoutePath("/users/:userId");
  pathHandler.addRoutePath("/users/:userId/friends");
  pathHandler.addRoutePath("/users/:userId/friends/:friendId");
  assertEquals(pathHandler.findMatch("/"), "/");
});

Deno.test("handler handles /users", () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath("/");
  pathHandler.addRoutePath("/users");
  pathHandler.addRoutePath("/users/:userId");
  pathHandler.addRoutePath("/users/:userId/friends");
  pathHandler.addRoutePath("/users/:userId/friends/:friendId");
  assertEquals(pathHandler.findMatch("/users"), "/users");
});

Deno.test("handler handles /users/:userId", () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath("/");
  pathHandler.addRoutePath("/users");
  pathHandler.addRoutePath("/users/:userId");
  pathHandler.addRoutePath("/users/:userId/friends");
  pathHandler.addRoutePath("/users/:userId/friends/:friendId");
  assertEquals(pathHandler.findMatch("/users/Alice"), "/users/:userId");
  assertEquals(pathHandler.findMatch("/users/Bob"), "/users/:userId");
  assertEquals(pathHandler.findMatch("/users/Charlie"), "/users/:userId");
});

Deno.test("handler handles /users/:userId/friends", () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath("/");
  pathHandler.addRoutePath("/users");
  pathHandler.addRoutePath("/users/:userId");
  pathHandler.addRoutePath("/users/:userId/friends");
  pathHandler.addRoutePath("/users/:userId/friends/:friendId");
  assertEquals(
    pathHandler.findMatch("/users/Alice/friends"),
    "/users/:userId/friends",
  );
  assertEquals(
    pathHandler.findMatch("/users/Bob/friends"),
    "/users/:userId/friends",
  );
  assertEquals(
    pathHandler.findMatch("/users/Charlie/friends"),
    "/users/:userId/friends",
  );
});

Deno.test("handler handles /users/:userId/friends/:friendId", () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath("/");
  pathHandler.addRoutePath("/users");
  pathHandler.addRoutePath("/users/:userId");
  pathHandler.addRoutePath("/users/:userId/friends");
  pathHandler.addRoutePath("/users/:userId/friends/:friendId");
  assertEquals(
    pathHandler.findMatch("/users/Alice/friends/Bob"),
    "/users/:userId/friends/:friendId",
  );
  assertEquals(
    pathHandler.findMatch("/users/Alice/friends/Charlie"),
    "/users/:userId/friends/:friendId",
  );
  assertEquals(
    pathHandler.findMatch("/users/Bob/friends/Alice"),
    "/users/:userId/friends/:friendId",
  );
  assertEquals(
    pathHandler.findMatch("/users/Bob/friends/Charlie"),
    "/users/:userId/friends/:friendId",
  );
  assertEquals(
    pathHandler.findMatch("/users/Charlie/friends/Alice"),
    "/users/:userId/friends/:friendId",
  );
  assertEquals(
    pathHandler.findMatch("/users/Charlie/friends/Bob"),
    "/users/:userId/friends/:friendId",
  );
});

Deno.test("handler ignores trailing /", () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath("/");
  pathHandler.addRoutePath("/users");
  pathHandler.addRoutePath("/users/:userId");
  pathHandler.addRoutePath("/users/:userId/friends");
  pathHandler.addRoutePath("/users/:userId/friends/:friendId");
  assertEquals(pathHandler.findMatch("/users/"), "/users");
  assertEquals(pathHandler.findMatch("/users/Alice/"), "/users/:userId");
  assertEquals(
    pathHandler.findMatch("/users/Alice/friends/"),
    "/users/:userId/friends",
  );
  assertEquals(
    pathHandler.findMatch("/users/Alice/friends/Bob/"),
    "/users/:userId/friends/:friendId",
  );
});

Deno.test("handler ignores multiple leading /", () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath("/");
  pathHandler.addRoutePath("/users");
  pathHandler.addRoutePath("/users/:userId");
  pathHandler.addRoutePath("/users/:userId/friends");
  pathHandler.addRoutePath("/users/:userId/friends/:friendId");
  assertEquals(pathHandler.findMatch("//"), "/");
  assertEquals(pathHandler.findMatch("///users"), "/users");
  assertEquals(pathHandler.findMatch("////users/Alice"), "/users/:userId");
  assertEquals(
    pathHandler.findMatch("/////users/Alice/friends"),
    "/users/:userId/friends",
  );
  assertEquals(
    pathHandler.findMatch("//////users/Alice/friends/Bob"),
    "/users/:userId/friends/:friendId",
  );
});

Deno.test("handler recognizes empty paths", () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath("/");
  pathHandler.addRoutePath("/users");
  pathHandler.addRoutePath("/users/:userId");
  pathHandler.addRoutePath("/users/:userId/friends");
  pathHandler.addRoutePath("/users/:userId/friends/:friendId");
  assertEquals(
    pathHandler.findMatch("/users//friends"),
    "/users/:userId/friends",
  );
  assertEquals(
    pathHandler.findMatch("/users//friends/Bob"),
    "/users/:userId/friends/:friendId",
  );
  assertEquals(pathHandler.findMatch("/users/Alice//friends"), undefined);
  assertEquals(pathHandler.findMatch("/users/Alice//friends/Bob"), undefined);
  assertEquals(pathHandler.findMatch("/users/Alice//Bob"), undefined);
  assertEquals(pathHandler.findMatch("/users/friends//Bob"), undefined);
});

Deno.test("handler handles mix of / caveats", () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath("/");
  pathHandler.addRoutePath("/users");
  pathHandler.addRoutePath("/users/:userId");
  pathHandler.addRoutePath("/users/:userId/friends");
  pathHandler.addRoutePath("/users/:userId/friends/:friendId");
  assertEquals(pathHandler.findMatch("//users/"), "/users");
  assertEquals(pathHandler.findMatch("/users//"), "/users/:userId");
  assertEquals(pathHandler.findMatch("//users//"), "/users/:userId");
  assertEquals(
    pathHandler.findMatch("//users//friends/"),
    "/users/:userId/friends",
  );
  assertEquals(
    pathHandler.findMatch("/users//friends//"),
    "/users/:userId/friends/:friendId",
  );
  assertEquals(
    pathHandler.findMatch("//users//friends//"),
    "/users/:userId/friends/:friendId",
  );
  assertEquals(pathHandler.findMatch("/users///"), undefined);
  assertEquals(pathHandler.findMatch("//users///"), undefined);
  assertEquals(pathHandler.findMatch("/users//friends///"), undefined);
  assertEquals(pathHandler.findMatch("//users//friends///"), undefined);
});

/**
 * Custom cases
 */

Deno.test("handler doesn't match partial url paths", () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath("/users/:userId");
  assertEquals(pathHandler.findMatch("/"), undefined);
  assertEquals(pathHandler.findMatch("//"), undefined);
  assertEquals(pathHandler.findMatch("/users"), undefined);
  assertEquals(pathHandler.findMatch("/users/"), undefined);
  assertEquals(pathHandler.findMatch("//users/"), undefined);
});

Deno.test("handler doesn't match partial route paths", () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath("/users/:userId");
  assertEquals(pathHandler.findMatch("/users/Alice/friends"), undefined);
  assertEquals(pathHandler.findMatch("/users/:userId/friends"), undefined);
});

Deno.test("handler doesn't confuse root path", () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath("/:slug");
  assertEquals(pathHandler.findMatch("/"), undefined);
  assertEquals(pathHandler.findMatch("//"), undefined);
});

Deno.test("handler prioritizes route path registered earliest", () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath("/:id");
  pathHandler.addRoutePath("/:id2");
  for (let i = 0; i < 20; i++) {
    assertEquals(pathHandler.findMatch("/users"), "/:id");
  }
});

Deno.test("handler prioritizes route path with exact match", () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath("/:slug");
  pathHandler.addRoutePath("/users");
  for (let i = 0; i < 20; i++) {
    assertEquals(pathHandler.findMatch("/users"), "/users");
  }
});

Deno.test("handler prioritizes route path with early exact match", () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath("/:slug/:id/friends");
  pathHandler.addRoutePath("/users/:id/friends");
  for (let i = 0; i < 20; i++) {
    assertEquals(
      pathHandler.findMatch("/users/Alice/friends"),
      "/users/:id/friends",
    );
  }
});

Deno.test("handler doesn't confuse deceiving early match", () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath("/:slug/:id/friends");
  pathHandler.addRoutePath("/users/:id");
  for (let i = 0; i < 20; i++) {
    assertEquals(
      pathHandler.findMatch("/users/Alice/friends"),
      "/:slug/:id/friends",
    );
    assertEquals(pathHandler.findMatch("/users/Alice"), "/users/:id");
  }
});

Deno.test("creates empty req.params", () => {
  const { createPathParams } = RoutePathHandler;
  assertEquals(createPathParams("/", "/"), {});
  assertEquals(createPathParams("/users", "/users"), {});
});

Deno.test("creates req.params properly", () => {
  const { createPathParams } = RoutePathHandler;
  assertEquals(createPathParams("/users/:userId", "/users/Alice"), {
    userId: "Alice",
  });
  assertEquals(
    createPathParams(
      "/users/:userId/friends/:friendId",
      "/users/Alice/friends/Bob",
    ),
    { userId: "Alice", friendId: "Bob" },
  );
});
