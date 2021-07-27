import {
  assertEquals,
  createWorker,
  dirname,
  fromFileUrl,
  join,
} from "../../dev_deps.ts";
import { assertResponse } from "./assertResponse.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));

Deno.test("single path parameter is set", async () => {
  const script = await createWorker(join(__dirname, "./scripts/pathParams.ts"));
  await script.start();
  const [response] = await script.fetch("/users/Alice");
  await assertResponse(script, async () => {
    assertEquals(await response.text(), "Alice");
  });
});

Deno.test("multiple path parameters are set", async () => {
  const script = await createWorker(join(__dirname, "./scripts/pathParams.ts"));
  await script.start();
  const [response] = await script.fetch("/users/Alice/friends/Bob");
  await assertResponse(script, async () => {
    assertEquals(await response.text(), "Alice+Bob");
  });
});

Deno.test("empty path parameter is set", async () => {
  const script = await createWorker(join(__dirname, "./scripts/pathParams.ts"));
  await script.start();
  const [response] = await script.fetch("/users//");
  await assertResponse(script, async () => {
    assertEquals(await response.text(), "");
  });
});

Deno.test("multiple empty path parameters are set", async () => {
  const script = await createWorker(join(__dirname, "./scripts/pathParams.ts"));
  await script.start();
  const [response] = await script.fetch("/users//friends//");
  await assertResponse(script, async () => {
    assertEquals(await response.text(), "+");
  });
});

Deno.test("trailing slash doesn't mess up", async () => {
  const script = await createWorker(join(__dirname, "./scripts/pathParams.ts"));
  await script.start();
  const [response] = await script.fetch("/users/Alice/");
  await assertResponse(script, async () => {
    assertEquals(await response.text(), "Alice");
  });
});

Deno.test("ambiguous 404", async () => {
  const script = await createWorker(join(__dirname, "./scripts/pathParams.ts"));
  await script.start();
  const [response] = await script.fetch("/friends/");
  await assertResponse(script, () => {
    assertEquals(response.ok, false);
    assertEquals(response.status, 404);
  });
});
