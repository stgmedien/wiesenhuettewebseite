// Einmal-Tooling: verkleinert übergroße Bilder unter public/media in-place.
// Quell-Bilder waren bis 5 MB groß → blähen Next-Image-Optimizer + Repo auf.
// Strategie: längste Kante auf MAX_EDGE begrenzen, q≈80 neu kodieren.
// Dateiname/Extension bleiben gleich (PNG behält .png, Inhalt wird aber
// JPEG-komprimiert wenn es ein Foto ist — Browser & next/image erkennen
// das Format am Inhalt, nicht an der Endung).
//
// Lauf:  node scripts/optimize-media.mjs
//        node scripts/optimize-media.mjs --dry

import { readdir, stat, readFile, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import sharp from "sharp";

const ROOT = "public/media";
const MAX_EDGE = 2000; // px, längste Kante
const SIZE_THRESHOLD = 600 * 1024; // > 600 KB → anfassen
const JPEG_Q = 80;
const WEBP_Q = 80;
const DRY = process.argv.includes("--dry");

const exts = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

let totalBefore = 0;
let totalAfter = 0;
let touched = 0;
let skipped = 0;

for await (const file of walk(ROOT)) {
  const ext = extname(file).toLowerCase();
  if (!exts.has(ext)) continue;

  const st = await stat(file);
  const before = st.size;

  let img;
  try {
    img = sharp(await readFile(file), { failOn: "none" });
  } catch {
    console.warn("  ! unlesbar, übersprungen:", file);
    skipped++;
    continue;
  }
  const meta = await img.metadata();
  const longest = Math.max(meta.width || 0, meta.height || 0);

  const needsResize = longest > MAX_EDGE;
  const needsRecompress = before > SIZE_THRESHOLD;
  if (!needsResize && !needsRecompress) {
    skipped++;
    continue;
  }

  let pipeline = img.rotate(); // EXIF-Orientierung anwenden
  if (needsResize) {
    pipeline = pipeline.resize({
      width: meta.width >= meta.height ? MAX_EDGE : undefined,
      height: meta.height > meta.width ? MAX_EDGE : undefined,
      withoutEnlargement: true,
    });
  }

  let out;
  if (ext === ".webp") {
    out = await pipeline.webp({ quality: WEBP_Q }).toBuffer();
  } else if (ext === ".png") {
    // Foto-PNGs: JPEG-Inhalt (drastisch kleiner), .png-Name bleibt.
    // Echte Grafik-PNGs (Portraits mit Transparenz) hätten Alpha — wenn
    // Alpha vorhanden, als komprimiertes PNG behalten.
    if (meta.hasAlpha) {
      out = await pipeline
        .png({ compressionLevel: 9, palette: true, quality: 90 })
        .toBuffer();
    } else {
      out = await pipeline.jpeg({ quality: JPEG_Q, mozjpeg: true }).toBuffer();
    }
  } else {
    out = await pipeline.jpeg({ quality: JPEG_Q, mozjpeg: true }).toBuffer();
  }

  totalBefore += before;
  if (out.length < before) {
    totalAfter += out.length;
    touched++;
    const pct = ((1 - out.length / before) * 100).toFixed(0);
    console.log(
      `  ${DRY ? "[dry] " : ""}${file}  ${(before / 1024).toFixed(0)}KB → ${(
        out.length / 1024
      ).toFixed(0)}KB  (-${pct}%)`
    );
    if (!DRY) await writeFile(file, out);
  } else {
    totalAfter += before;
    skipped++;
  }
}

console.log(
  `\nFertig. ${touched} Dateien optimiert, ${skipped} übersprungen.\n` +
    `Gesamt: ${(totalBefore / 1048576).toFixed(1)} MB → ${(
      totalAfter / 1048576
    ).toFixed(1)} MB`
);
