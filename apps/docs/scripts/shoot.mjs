/**
 * Screenshots a page at a given scroll offset.
 *
 * Chrome's `--screenshot` flag cannot scroll, and the landing's motion is tied
 * to the scroll position, so reviewing it needs a driver. This talks to Chrome
 * over the DevTools protocol rather than pulling in a browser automation
 * dependency the app itself never uses.
 *
 * Usage: node shoot.mjs <url> <out.png> [scrollY] [width] [height]
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, out, scrollY = "0", width = "1440", height = "900"] =
  process.argv.slice(2);

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;

const chrome = spawn(CHROME, [
  "--headless",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), "shoot-"))}`,
  `--window-size=${width},${height}`,
  "--hide-scrollbars",
  "--force-dark-mode",
  // Software WebGL: the shaders render nothing on a headless machine without
  // it, which reads as a broken page rather than a missing GPU.
  "--enable-unsafe-swiftshader",
  "--use-gl=angle",
  "--use-angle=swiftshader",
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const pages = (await res.json()).filter((t) => t.type === "page");
      if (pages[0]?.webSocketDebuggerUrl) return pages[0].webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error("Chrome never exposed a debuggable page");
}

const ws = new WebSocket(await target());
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

let id = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const n = ++id;
    pending.set(n, resolve);
    ws.send(JSON.stringify({ id: n, method, params }));
  });

await send("Page.enable");
await send("Page.navigate", { url });
await sleep(3500); // shaders mount on a timer, past first paint

if (scrollY !== "0") {
  await send("Runtime.evaluate", {
    expression: `window.scrollTo({ top: ${scrollY}, behavior: "instant" })`,
  });
  // ScrollTrigger updates on the next frame; two frames is enough to settle.
  await sleep(900);
}

const shot = await send("Page.captureScreenshot", { format: "png" });
writeFileSync(out, Buffer.from(shot.data, "base64"));

const errors = await send("Runtime.evaluate", {
  expression: "JSON.stringify(window.__shootErrors ?? [])",
  returnByValue: true,
});
console.log(out, "| console errors:", errors.result?.value ?? "[]");

ws.close();
chrome.kill();
