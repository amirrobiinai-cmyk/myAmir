// Renders index.html frame-by-frame with headless Chromium and pipes PNGs to ffmpeg.
// Usage: node render.mjs [--stills]
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const FPS = 30, DUR = 10, N = FPS * DUR;
const stills = process.argv.includes("--stills");

const types = { ".html": "text/html", ".ttf": "font/ttf", ".png": "image/png" };
const server = createServer(async (req, res) => {
  try {
    const p = join(DIR, decodeURIComponent(new URL(req.url, "http://x").pathname));
    const body = await readFile(p.endsWith("/") ? p + "index.html" : p);
    res.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ args: ["--force-color-profile=srgb"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(`http://localhost:${port}/index.html`);
await page.evaluate(() => window.ready);

const grab = t => page.evaluate(t => { window.render(t); return document.getElementById("c").toDataURL("image/png").split(",")[1]; }, t);

if (stills) {
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir(join(DIR, "out/stills"), { recursive: true });
  for (const t of [0.2, 1.2, 2.8, 3.8, 5.0, 6.2, 7.3, 8.3, 8.85, 9.1, 9.99]) {
    await writeFile(join(DIR, `out/stills/t${t.toFixed(2)}.png`), Buffer.from(await grab(t), "base64"));
  }
} else {
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-i", join(DIR, "out/audio.wav"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-profile:v", "high",
    "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart",
    join(DIR, "out/pampena_promo_1080x1920.mp4")], { stdio: ["pipe", "inherit", "inherit"] });
  for (let i = 0; i < N; i++) {
    const buf = Buffer.from(await grab(i / FPS), "base64");
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
    if (i % 30 === 0) process.stdout.write(`frame ${i}/${N}\n`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on("close", r));
}
await browser.close();
server.close();
