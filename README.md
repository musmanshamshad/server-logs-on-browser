# 📟 Live Web-Based PM2 Log Viewer

A real-time web interface to view and tail logs (`out` + `error`) for PM2-managed Node.js applications.  
Supports WebSocket streaming, Cloudflare Tunnel (HTTPS & WSS), and ANSI-free formatting in-browser.

---

## 🔧 Features

- 🟢 Combined log streaming from both `out.log` and `error.log`
- 🌈 Color-coded log highlighting (INFO, ERROR, WARNING, etc.)
- 📡 Real-time updates via WebSockets
- 🔐 Cloudflare Tunnel and HTTPS (WSS) compatible
- 📄 Automatically strips terminal ANSI escape codes (no junk in browser)
- 📊 Displays latest 1000 lines (500 from `out`, 500 from `error`)
- 🚀 Lightweight and fast

---

## 📁 Project Structure

logs/
├── index.js # WebSocket + Express backend
├── public/
│ └── index.html # Log viewer frontend
└── README.md

## Log File Format

## Update these lines in index.js according to application names.

/home/username/.pm2/logs/app1-out.log
/home/username/.pm2/logs/app1-error.log


## Update these lines in index.html according to application name.

    <label>
      Application:
      <select id="appName">
        <option value="app1">Name of App</option>
        <option value="app2">Name of App</option>
      </select>
    </label>


---

## ⚙️ Setup Instructions

### 1. Install dependencies (once)

Node.js v18.x or later
npm install express ws


---

## Run the project

node index.js

## with pm2

pm2 start index.js --name log-viewer