import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const EXTS = [".ts", ".tsx", ".js", ".mjs", ".json"];

function asFile(p) {
  if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  for (const ext of EXTS) {
    if (fs.existsSync(p + ext)) return p + ext;
  }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
    for (const name of ["index.ts", "index.tsx", "index.js"]) {
      const hit = path.join(p, name);
      if (fs.existsSync(hit)) return hit;
    }
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const hit = asFile(path.join(SRC, specifier.slice(2)));
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
  }
  if (specifier.startsWith(".") && context.parentURL) {
    const base = path.dirname(fileURLToPath(context.parentURL));
    const hit = asFile(path.resolve(base, specifier));
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
