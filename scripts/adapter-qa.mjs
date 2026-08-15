#!/usr/bin/env node
import { chromium } from "playwright";

const errors = [];
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !/404/.test(msg.text())) errors.push(msg.text());
  });

  await page.goto("http://127.0.0.1:8080/adapter?preset=drill", {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await page.waitForTimeout(1200);
  const title = await page.locator("h1").first().textContent();
  const vv = await page.getByText("V&V", { exact: false }).count();
  const held = await page.getByText("Spine holds", { exact: false }).count();
  await page.getByRole("button", { name: /Sheaf gate/ }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "/workspace/screenshots/adapter.png", fullPage: false });

  const studio = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  studio.on("pageerror", (e) => errors.push(`studio: ${e.message}`));
  await studio.goto("http://127.0.0.1:8080/studio", { waitUntil: "networkidle", timeout: 45000 });
  await studio.waitForTimeout(2000);
  const studioVv = await studio.getByText("Native Φ-space", { exact: false }).count();
  await studio.getByRole("button", { name: "Graphs" }).click();
  await studio.waitForTimeout(400);
  const orbit = await studio.getByText("Orbit-window cosine", { exact: false }).count();
  await studio.screenshot({ path: "/workspace/screenshots/studio.png", fullPage: false });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on("pageerror", (e) => errors.push(`mobile: ${e.message}`));
  await mobile.goto("http://127.0.0.1:8080/adapter?preset=drill", {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await mobile.waitForTimeout(700);
  const overflow = await mobile.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  );

  const ok = title === "Drill field" && vv && held && orbit && studioVv && !overflow && !errors.length;
  console.log(JSON.stringify({ title, vv, held, orbit, studioVv, overflow, errors, ok }, null, 2));
  if (!ok) process.exit(2);
} finally {
  await browser.close();
}
