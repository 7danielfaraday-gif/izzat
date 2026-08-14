import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Izzat storefront", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Izzat Express/i);
  assert.match(html, /Sua loja de utilidades e gadgets/i);
  assert.match(html, /<html[^>]+lang="pt-BR"/i);
  assert.doesNotMatch(html, /react-loading-skeleton|Your site is taking shape/i);
});

test("keeps production metadata and optional preview code out of the storefront", async () => {
  const [page, layout, packageJson, styles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /export default function Storefront/);
  assert.match(layout, /title:\s*"Izzat Express/);
  assert.match(page, /checkout-mobile-summary-toggle/);
  assert.match(page, /aria-expanded=\{mobileSummaryOpen\}/);
  assert.match(styles, /\.checkout-summary-column\.mobile-summary-open/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(layout, /codex-preview|_sites-preview|themeColor|\bViewport\b/);
});

test("emits a publishable Cloudflare Worker configuration", async () => {
  const [rootConfigText, generatedConfigText, packageText] = await Promise.all([
    readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
    readFile(new URL("../dist/server/wrangler.json", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  const rootConfig = JSON.parse(rootConfigText);
  const generatedConfig = JSON.parse(generatedConfigText);
  const packageJson = JSON.parse(packageText);

  assert.equal(rootConfig.name, "izzat-express");
  assert.deepEqual(rootConfig.kv_namespaces, [{ binding: "IZZAT_STORE" }]);
  assert.equal(rootConfig.assets.binding, "ASSETS");
  assert.equal(rootConfig.images.binding, "IMAGES");
  assert.equal(generatedConfig.main, "index.js");
  assert.equal(generatedConfig.assets.binding, "ASSETS");
  assert.equal(generatedConfig.assets.directory, "../client");
  assert.deepEqual(generatedConfig.kv_namespaces, [{ binding: "IZZAT_STORE" }]);
  assert.equal(generatedConfig.images.binding, "IMAGES");
  assert.equal(packageJson.engines.node, ">=22.13.0");
  assert.equal(packageJson.scripts.deploy, "npm run build && wrangler deploy");
  assert.doesNotMatch(generatedConfigText, /00000000-0000-4000-8000-000000000000/);
});
