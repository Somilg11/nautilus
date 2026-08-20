/**
 * Electron shell for Nautilus.
 *
 * The app itself is unchanged: this starts the local Next.js server as a child
 * process and points a native window at it, so the desktop build and the web
 * build are always the same application. The renderer is sandboxed and can only
 * reach that local server.
 */
const { app, BrowserWindow, dialog, shell, Menu } = require("electron")
const fs = require("node:fs")
const path = require("node:path")
const { pathToFileURL } = require("node:url")

const DEFAULT_PORT = Number(process.env.NAUTILUS_PORT || 3777)

let serverChild = null
let appUrl = null

/** bin/server.mjs is ESM; load it from CommonJS with a dynamic import. */
async function boot() {
  const server = await import(
    pathToFileURL(path.join(__dirname, "..", "bin", "server.mjs")).href
  )
  const { url, child } = await server.startServer({ port: DEFAULT_PORT })
  serverChild = child
  return url
}

/** Optional app icon: drop a 512×512 PNG at build/icon.png to brand the window. */
function iconPath() {
  const candidate = path.join(__dirname, "..", "build", "icon.png")
  return fs.existsSync(candidate) ? candidate : undefined
}

function createWindow(url) {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Nautilus",
    icon: iconPath(),
    backgroundColor: "#0a0a0a",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    autoHideMenuBar: process.platform !== "darwin",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  })

  win.loadURL(`${url}/dashboard`)
  win.once("ready-to-show", () => win.show())

  // External links open in the real browser, never inside the app shell.
  win.webContents.setWindowOpenHandler(({ url: target }) => {
    shell.openExternal(target)
    return { action: "deny" }
  })

  // Same for in-page navigations away from the local server.
  win.webContents.on("will-navigate", (event, target) => {
    if (!target.startsWith(url)) {
      event.preventDefault()
      shell.openExternal(target)
    }
  })

  if (process.env.NAUTILUS_DEVTOOLS === "1") {
    win.webContents.openDevTools({ mode: "detach" })
  }

  return win
}

function buildMenu(url) {
  const template = [
    ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
    {
      label: "File",
      submenu: [
        {
          label: "New Window",
          accelerator: "CmdOrCtrl+N",
          click: () => url && createWindow(url),
        },
        { type: "separator" },
        process.platform === "darwin" ? { role: "close" } : { role: "quit" },
      ],
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        {
          label: "Documentation",
          click: () => url && shell.openExternal(`${url}/docs`),
        },
        {
          label: "GitHub Repository",
          click: () => shell.openExternal("https://github.com/Somilg11/nautilus"),
        },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// One server, one app: a second launch focuses the existing window.
const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    } else if (appUrl) {
      createWindow(appUrl)
    }
  })

  app.whenReady().then(async () => {
    try {
      appUrl = await boot()
      buildMenu(appUrl)
      createWindow(appUrl)
    } catch (err) {
      dialog.showErrorBox(
        "Nautilus could not start",
        `${err.message}\n\nTry running "npm install" and "npm run build" in the project folder first.`
      )
      app.quit()
      return
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0 && appUrl) createWindow(appUrl)
    })
  })
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})

app.on("quit", () => {
  serverChild?.kill("SIGTERM")
})
