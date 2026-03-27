/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = { db: null };
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--db") {
      args.db = argv[++i] ?? "";
      continue;
    }
    if (token === "-h" || token === "--help") {
      args.help = true;
      continue;
    }
  }
  return args;
}

function pickDbPath(explicitDbPath) {
  if (explicitDbPath) {
    return path.resolve(explicitDbPath);
  }

  const appData = process.env.APPDATA;
  if (!appData) {
    throw new Error("APPDATA not set; pass --db <path-to-zse-pos.db>");
  }

  const candidates = [];
  const topLevel = fs.readdirSync(appData, { withFileTypes: true });
  for (const entry of topLevel) {
    if (!entry.isDirectory()) continue;
    const dbPath = path.join(appData, entry.name, "zse-pos.db");
    if (fs.existsSync(dbPath)) {
      const stat = fs.statSync(dbPath);
      candidates.push({ dbPath, mtimeMs: stat.mtimeMs });
    }
  }

  if (candidates.length === 0) {
    throw new Error(
      "Could not find zse-pos.db under %APPDATA%. Pass --db <path-to-zse-pos.db>.",
    );
  }

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates[0].dbPath;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log("Usage: node tools/list-users.js [--db <path-to-zse-pos.db>]");
    process.exit(0);
  }

  const dbPath = pickDbPath(args.db);

  const run = async () => {
    let initSqlJs;
    try {
      initSqlJs = require("sql.js");
    } catch (err) {
      console.error("ERROR: sql.js not available. Run `npm install` first.");
      process.exit(1);
    }

    const SQL = await initSqlJs({
      locateFile: (file) =>
        path.join(__dirname, "..", "node_modules", "sql.js", "dist", file),
    });

    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);

    const hasUsers = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
    );
    if (!hasUsers || hasUsers.length === 0) {
      console.error("ERROR: `users` table not found in:", dbPath);
      process.exit(1);
    }

    const result = db.exec(
      "SELECT id, username, role, created_at FROM users ORDER BY id ASC",
    );

    console.log("DB:", dbPath);
    if (!result || result.length === 0) {
      console.log("No users found.");
      return;
    }

    const { columns, values } = result[0];
    const idIndex = columns.indexOf("id");
    const usernameIndex = columns.indexOf("username");
    const roleIndex = columns.indexOf("role");

    for (const row of values) {
      const id = idIndex >= 0 ? row[idIndex] : "?";
      const username = usernameIndex >= 0 ? row[usernameIndex] : "";
      const role = roleIndex >= 0 ? row[roleIndex] : "";
      console.log(`#${id} ${username} (${role})`);
    }
  };

  run().catch((err) => {
    console.error("ERROR:", err.message);
    process.exit(1);
  });
}

main();
