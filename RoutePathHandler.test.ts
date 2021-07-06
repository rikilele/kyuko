import { assertEquals } from 'https://deno.land/std@0.100.0/testing/asserts.ts';
import { RoutePathHandler } from './RoutePathHandler.ts';

Deno.test('empty handler', () => {
  const pathHandler = new RoutePathHandler();
  assertEquals(pathHandler.findMatch('/'), undefined);
  assertEquals(pathHandler.findMatch('/users'), undefined);
  assertEquals(pathHandler.findMatch('/users/Alice'), undefined);
  assertEquals(pathHandler.findMatch('/users/Alice/friends'), undefined);
  assertEquals(pathHandler.findMatch('/users/Alice/friends/Bob'), undefined);
});

Deno.test('handler with /', () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath('/');
  assertEquals(pathHandler.findMatch('/'), '/');
  assertEquals(pathHandler.findMatch('/users'), undefined);
  assertEquals(pathHandler.findMatch('/users/Alice'), undefined);
  assertEquals(pathHandler.findMatch('/users/Alice/friends'), undefined);
  assertEquals(pathHandler.findMatch('/users/Alice/friends/Bob'), undefined);
});

Deno.test('handler with /users', () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath('/users');
  assertEquals(pathHandler.findMatch('/'), undefined);
  assertEquals(pathHandler.findMatch('/users'), '/users');
  assertEquals(pathHandler.findMatch('/users/Alice'), undefined);
  assertEquals(pathHandler.findMatch('/users/Alice/friends'), undefined);
  assertEquals(pathHandler.findMatch('/users/Alice/friends/Bob'), undefined);
});

Deno.test('handler with /users/:userId', () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath('/users/:userId');
  assertEquals(pathHandler.findMatch('/'), undefined);
  assertEquals(pathHandler.findMatch('/users'), undefined);
  assertEquals(pathHandler.findMatch('/users/Alice'), '/users/:userId');
  assertEquals(pathHandler.findMatch('/users/Alice/friends'), undefined);
  assertEquals(pathHandler.findMatch('/users/Alice/friends/Bob'), undefined);
});

Deno.test('handler with /users/:userId/friends', () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath('/users/:userId/friends');
  assertEquals(pathHandler.findMatch('/'), undefined);
  assertEquals(pathHandler.findMatch('/users'), undefined);
  assertEquals(pathHandler.findMatch('/users/Alice'), undefined);
  assertEquals(pathHandler.findMatch('/users/Alice/friends'), '/users/:userId/friends');
  assertEquals(pathHandler.findMatch('/users/Alice/friends/Bob'), undefined);
});

Deno.test('handler with /users/:userId/friends/:friendId', () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath('/users/:userId/friends/:friendId');
  assertEquals(pathHandler.findMatch('/'), undefined);
  assertEquals(pathHandler.findMatch('/users'), undefined);
  assertEquals(pathHandler.findMatch('/users/Alice'), undefined);
  assertEquals(pathHandler.findMatch('/users/Alice/friends'), undefined);
  assertEquals(pathHandler.findMatch('/users/Alice/friends/Bob'), '/users/:userId/friends/:friendId');
});

Deno.test('handler ignores trailing /', () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath('/');
  pathHandler.addRoutePath('/users');
  pathHandler.addRoutePath('/users/:userId');
  assertEquals(pathHandler.findMatch('/'), '/');
  assertEquals(pathHandler.findMatch('//'), '/');
  assertEquals(pathHandler.findMatch('/users'), '/users');
  assertEquals(pathHandler.findMatch('/users/'), '/users');
  assertEquals(pathHandler.findMatch('/users/Alice'), '/users/:userId');
  assertEquals(pathHandler.findMatch('/users/Alice/'), '/users/:userId');
  assertEquals(pathHandler.findMatch('/users/Alice/friends'), undefined);
});

Deno.test('handler ignores multiple leading /', () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath('/');
  pathHandler.addRoutePath('/users');
  pathHandler.addRoutePath('/users/:userId');
  assertEquals(pathHandler.findMatch('/'), '/');
  assertEquals(pathHandler.findMatch('//'), '/');
  assertEquals(pathHandler.findMatch('///users'), '/users');
  assertEquals(pathHandler.findMatch('///users/Alice'), '/users/:userId');
  assertEquals(pathHandler.findMatch('////users/Alice/friends'), undefined);
});

Deno.test('handler recognizes empty paths', () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath('/');
  pathHandler.addRoutePath('/users');
  pathHandler.addRoutePath('/users/:userId');
  assertEquals(pathHandler.findMatch('/'), '/');
  assertEquals(pathHandler.findMatch('/users/'), '/users');
  assertEquals(pathHandler.findMatch('/users/Alice/'), '/users/:userId');
  assertEquals(pathHandler.findMatch('/users//'), '/users/:userId');
});

Deno.test('handler prioritizes route path registered earliest', () => {
  const pathHandler = new RoutePathHandler();
  pathHandler.addRoutePath('/users');
  pathHandler.addRoutePath('/:id');
  pathHandler.addRoutePath('/:id2');
  assertEquals(pathHandler.findMatch('/'), undefined);
  assertEquals(pathHandler.findMatch('/users'), '/users');
  for (let i = 0; i < 100; i++) {
    assertEquals(pathHandler.findMatch('/user'), '/:id');
  }
});
