// Precompiles Tailwind CSS to a static file so builds never depend on
// PostCSS plugin discovery inside Next.js (works identically locally,
// on Vercel, and in CI).
const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const root = path.resolve(__dirname, "..");
const cli = path.join(root, "node_modules", "tailwindcss", "lib", "cli.js");
const input = path.join(root, "src", "app", "tw-source.css");
const output = path.join(root, "src", "app", "tw-generated.css");

execFileSync(
  process.execPath,
  [cli, "-i", input, "-o", output],
  { cwd: root, stdio: "inherit" },
);

const size = fs.statSync(output).size;
console.log(`tailwind css generated: ${(size / 1024).toFixed(0)} KB`);
if (size < 20_000) {
  console.error("Generated CSS suspiciously small — utilities may be missing.");
  process.exit(1);
}
