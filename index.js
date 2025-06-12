const express = require("express");
const fs = require("fs");
const WebSocket = require("ws");
const app = express();
const PORT = process.env.PORT || 3287;

// Log paths for your applications
const logFiles = {
  app1: {
    out: "/home/username/.pm2/logs/app1-out.log",
    error: "/home/username/.pm2/logs/app1-error.log",
  },
  app2: {
    out: "/home/username/.pm2/logs/app1-out.log",
    error: "/home/username/.pm2/logs/app1-error.log",
  },
};

// Serve static files from ./public
app.use(express.static("public"));

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });
const watchers = new Map();

// 🔧 Strip ANSI color codes from logs
function stripAnsiCodes(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    let parsed;
    try {
      parsed = JSON.parse(message);
    } catch {
      ws.send("Invalid message format. Expected JSON.");
      return;
    }

    const { appName } = parsed;
    const outPath = logFiles[appName]?.out;
    const errPath = logFiles[appName]?.error;

    if (!outPath || !errPath) {
      ws.send("Invalid application name.");
      return;
    }

    // 📄 Send last 80 lines from both out and error
    const sendTail = (path) => {
      try {
        const data = fs.readFileSync(path, "utf8");
        const lines = data.trim().split("\n");
        return lines.slice(-500).join("\n");
      } catch (err) {
        return `Error reading ${path}: ${err.message}`;
      }
    };

    const combined =
      stripAnsiCodes(sendTail(outPath)) +
      "\n" +
      stripAnsiCodes(sendTail(errPath));
    ws.send(combined);

    // 📡 Stream new log content from both files
    const sendUpdate = (path) => {
      let previousSize = fs.existsSync(path) ? fs.statSync(path).size : 0;

      const watcher = (curr, prev) => {
        if (curr.size > prev.size) {
          const stream = fs.createReadStream(path, {
            start: previousSize,
            encoding: "utf8",
          });
          previousSize = curr.size;

          stream.on("data", (chunk) => {
            ws.send(stripAnsiCodes(chunk));
          });

          stream.on("error", (err) => {
            ws.send(`Error streaming log: ${err.message}`);
          });
        }
      };

      fs.watchFile(path, { interval: 1000 }, watcher);
      return () => fs.unwatchFile(path, watcher);
    };

    const cleanupOut = sendUpdate(outPath);
    const cleanupErr = sendUpdate(errPath);

    watchers.set(ws, () => {
      cleanupOut();
      cleanupErr();
    });
  });

  ws.on("close", () => {
    if (watchers.has(ws)) watchers.get(ws)();
    watchers.delete(ws);
  });
});
