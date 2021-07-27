import {
  assertEquals,
  createWorker,
  dirname,
  fromFileUrl,
  join,
} from "../../dev_deps.ts";
import { assertResponse } from "./assertResponse.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));

Deno.test("hello world", async () => {
  const script = await createWorker(join(__dirname, "./scripts/helloWorld.ts"));
  await script.start();
  const [response] = await script.fetch("/");
  await assertResponse(script, async () => {
    assertEquals(await response.text(), "Hello World!");
  });
});

Deno.test("hello world 404", async () => {
  const script = await createWorker(join(__dirname, "./scripts/helloWorld.ts"));
  await script.start();
  const [response] = await script.fetch("/Alice");
  await assertResponse(script, () => {
    assertEquals(response.ok, false);
    assertEquals(response.status, 404);
  });
});
