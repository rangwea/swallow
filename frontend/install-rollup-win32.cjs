const { execSync } = require("node:child_process");

if (process.platform === "win32") {
  execSync(
    "npm install @rollup/rollup-win32-x64-msvc@4.18.0 --no-save --force",
    { stdio: "inherit" }
  );
}
