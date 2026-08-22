// Deploys the project to Vercel production with an explicit working directory.
const { spawn } = require("child_process");
const path = require("path");

const projectDir = path.resolve(__dirname, "..");

const child = spawn("npx", ["-y", "vercel", "--prod", "--yes"], {
  cwd: projectDir,
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code) => {
  console.log(`deploy exited with ${code}`);
  process.exit(code ?? 0);
});
