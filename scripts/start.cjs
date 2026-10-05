/**
 * Start a production build: `npm run build`, then `npm start`.
 *
 * Self-hosted builds use Next's standalone output, which `next start` does
 * not serve. This copies the static assets the standalone server expects next
 * to it, then runs it. Builds without standalone output (Vercel) fall back to
 * `next start`.
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");
const server = path.join(standalone, "server.js");

function run(command, args, options) {
  const child = spawn(command, args, { stdio: "inherit", ...options });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => child.kill(signal));
  }
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });
}

if (fs.existsSync(server)) {
  fs.cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), {
    recursive: true,
  });
  fs.cpSync(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
  // `npm start -- -p 4000` keeps working as it did with `next start`.
  const args = process.argv.slice(2);
  const portFlag = args.findIndex((a) => a === "-p" || a === "--port");
  const env = { ...process.env };
  if (portFlag >= 0 && args[portFlag + 1]) env.PORT = args[portFlag + 1];
  // The server runs from .next/standalone, so a relative SQLite path would
  // open a different, empty file there. Pin it to the project directory.
  const url =
    env.DATABASE_URL?.trim() || env.TURSO_DATABASE_URL?.trim() || "file:mizan.db";
  if (url.startsWith("file:") && !path.isAbsolute(url.slice(5))) {
    env.DATABASE_URL = `file:${path.resolve(root, url.slice(5))}`;
  }
  run(process.execPath, [server], { cwd: standalone, env });
} else {
  run(process.execPath, [require.resolve("next/dist/bin/next"), "start", ...process.argv.slice(2)], {
    cwd: root,
  });
}
