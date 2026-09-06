/**
 * Generate PWA icons from SVG.
 * Run: node scripts/generate-icons.mjs
 * Requires: npm install sharp (dev dependency)
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PUBLIC = join(import.meta.dirname, "..", "public");
const SVG_PATH = join(PUBLIC, "icon-192.svg");

const SIZES = [
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 32, name: "favicon-32x32.png" },
  { size: 16, name: "favicon-16x16.png" },
];

async function generate() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("sharp not installed. Run: npm install sharp");
    process.exit(1);
  }

  const svg = readFileSync(SVG_PATH, "utf-8");

  for (const { size, name } of SIZES) {
    const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
    writeFileSync(join(PUBLIC, name), buf);
    console.log(`  Created ${name} (${size}x${size})`);
  }

  console.log("\nAll icons generated in public/");
}

generate().catch((e) => {
  console.error(e);
  process.exit(1);
});
