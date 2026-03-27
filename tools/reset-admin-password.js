/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function parseArgs(argv) {
  const args = { username: "admin", password: null, db: null };
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--username") {
      args.username = argv[++i] ?? "";
      continue;
    }
    if (token === "--password") {
      args.password = argv[++i] ?? "";
      continue;
    }
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

function hashPassword(plain) {
  if (typeof plain !== "string" || plain.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  const iterations = 210000;
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(plain, salt, iterations, 32, "sha256");
  return `pbkdf2$sha256$${iterations}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve("");
      return;
    }
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
  });
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
    console.log(
      "Usage: node tools/reset-admin-password.js --username <user> [--password <newPassword>] [--db <path>]",
    );
    process.exit(0);
  }

  const username = typeof args.username === "string" ? args.username.trim() : "";
  if (!username) {
    console.error("ERROR: --username is required");
    process.exit(1);
  }

  const dbPath = pickDbPath(args.db);
  if (!fs.existsSync(dbPath)) {
    console.error("ERROR: Database not found:", dbPath);
    process.exit(1);
  }

  const run = async () => {
    const stdin = (await readStdin()).trim();
    const password =
      typeof args.password === "string" && args.password
        ? args.password
        : stdin;
    if (typeof password !== "string" || !password) {
      console.error(
        "ERROR: password is required (pass --password or pipe it via stdin).",
      );
      process.exit(1);
    }

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

    const selectUser = db.exec(
      "SELECT id, username FROM users WHERE username = ?",
      [username],
    );
    if (!selectUser || selectUser.length === 0 || selectUser[0].values.length === 0) {
      console.error("ERROR: User not found:", username);
      process.exit(1);
    }

    const userId = selectUser[0].values[0][0];
    const userName = selectUser[0].values[0][1];

    const newHash = hashPassword(password);
    db.run("UPDATE users SET password = ? WHERE id = ?", [newHash, userId]);

    const updated = Buffer.from(db.export());
    fs.writeFileSync(dbPath, updated);

    console.log("✅ Password reset successful");
    console.log("DB:", dbPath);
    console.log("User:", userName);
  };

  run().catch((err) => {
    console.error("ERROR:", err.message);
    process.exit(1);
  });
}

main();
