import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".vercel/output");

test("production routes hashed assets before the SSR catch-all", () => {
  const config = JSON.parse(readFileSync(join(out, "config.json"), "utf8"));
  const routes = config.routes ?? [];
  const assetIdx = routes.findIndex((r) => String(r.src ?? "").includes("/assets/"));
  const catchIdx = routes.findIndex((r) => r.dest === "/__server" || r.src === "/(.*)");
  assert.ok(assetIdx >= 0, "missing /assets/ route");
  assert.ok(catchIdx >= 0, "missing server catch-all");
  assert.ok(assetIdx < catchIdx, "assets must win over the HTML fallback");
});

test("production ships the adapter and studio modules as JS, not HTML", () => {
  const assets = join(out, "static/assets");
  assert.ok(existsSync(assets), "static/assets missing");
  const files = readdirSync(assets);
  assert.ok(files.some((f) => f.startsWith("adapter-") && f.endsWith(".js")));
  assert.ok(files.some((f) => f.startsWith("studio-") && f.endsWith(".js")));
  assert.ok(files.some((f) => f.startsWith("styles-") && f.endsWith(".css")));
  assert.ok(existsSync(join(out, "functions/__server.func/index.mjs")));
});

test("PGLite data sits next to the bundled module so preview without Neon still boots", () => {
  const libs = join(out, "functions/__server.func/_libs");
  if (!existsSync(join(libs, "electric-sql__pglite.mjs"))) return;
  assert.ok(existsSync(join(libs, "pglite.data")), "pglite.data");
  assert.ok(existsSync(join(libs, "pglite.wasm")), "pglite.wasm");
  assert.ok(existsSync(join(libs, "initdb.wasm")), "initdb.wasm");
});

