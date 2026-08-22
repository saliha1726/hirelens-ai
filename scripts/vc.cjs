// Runs the Vercel CLI with the project directory as cwd.
const { spawn } = require("child_process");
const path = require("path");

const projectDir = path.resolve(__dirname, "..");
const args = ["-y", "vercel", ...process.argv.slice(2)];

const child = spawn("npx", args, {
  cwd: projectDir,
  stdio: "inherit",
  shell: process.platform === "win32",
});
child.on("exit", (code) => process.exit(code ?? 0));
