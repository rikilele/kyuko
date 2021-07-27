import {
  assertEquals,
  createWorker,
  dirname,
  fromFileUrl,
  join,
} from "../../dev_deps.ts";
import { assertResponse } from "./assertResponse.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));

Deno.test("returns query string", async () => {
  const script = await createWorker(join(__dirname, "./scripts/query.ts"));
  await script.start();
  const [response] = await script.fetch("/?q=Query");
  await assertResponse(script, async () => {
    assertEquals(await response.text(), "q=Query");
  });
});

Deno.test("handles multiple query strings", async () => {
  const script = await createWorker(join(__dirname, "./scripts/query.ts"));
  await script.start();
  const [response] = await script.fetch("/?q=Query&qs=QueryString");
  await assertResponse(script, async () => {
    assertEquals(await response.text(), "q=Query&qs=QueryString");
  });
});

Deno.test("handles duplicate keys", async () => {
  const script = await createWorker(join(__dirname, "./scripts/query.ts"));
  await script.start();
  const [response] = await script.fetch("/?q=Query&q=QueryString");
  await assertResponse(script, async () => {
    assertEquals(await response.text(), "q=Query&q=QueryString");
  });
});
