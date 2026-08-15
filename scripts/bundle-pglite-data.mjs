import { copyFileSync, existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("@electric-sql/pglite"));
const dest = join(process.cwd(), ".vercel/output/functions/__server.func/_libs");
if (!existsSync(dest)) {
  console.log("[bundle-pglite] no vercel function dir — skip");
  process.exit(0);
}
const names = readdirSync(dist).filter((n) => /\.(wasm|data)$/.test(n));
for (const name of names) {
  copyFileSync(join(dist, name), join(dest, name));
  console.log("[bundle-pglite] copied", name);
}
