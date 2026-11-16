import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import test from "node:test";
import { fileURLToPath } from "node:url";
import next from "next";

test("server-renders the homepage correctly", async (t) => {
  const hostname = "127.0.0.1";
  const server = createServer();
  const listening = once(server, "listening");
  server.listen(0, hostname);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await listening;

  const { port } = server.address();
  const app = next({ dev: false, dir: fileURLToPath(new URL("../", import.meta.url)), hostname, port, quiet: true });
  t.after(() => app.close());
  await app.prepare();
  server.on("request", app.getRequestHandler());
  const response = await fetch(`http://${hostname}:${port}/`, {
    headers: { accept: "text/html" },
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Carnival of Clothes/i);
  assert.match(html, /by nandini/i);
  assert.match(html, /Shop by Category/i);
  assert.match(html, /home-reviews-title/);
});

test("keeps pages structured and correct", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /export default (?:async )?function Home/);
  assert.match(layout, /html lang="en"/);
  assert.match(packageJson, /"next":/);
});
