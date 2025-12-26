const { app, BrowserWindow, protocol } = require("electron");
const path = require("path");
const mime = require("mime-types");
const fs = require("fs");

let server;

function getDistPath() {
  if (!app.isPackaged) {
    return path.join(__dirname, "../dist");
  }
  return path.join(process.resourcesPath, "app.asar.unpacked", "dist");
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 760,
    webPreferences: {
      contextIsolation: true,
    },
    icon: path.join(__dirname, "../assets/icon.png"),
  });

  const distPath = getDistPath();

  protocol.handle("cozyhydrate", async (request) => {
    const url = new URL(request.url);
    let filePath = path.join(distPath, url.pathname);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distPath, "index.html");
    }

    const contentType = mime.lookup(filePath) || "text/plain";

    return new Response(fs.readFileSync(filePath), {
      headers: {
        "Content-Type": contentType,
      },
    });
  });

  win.loadURL("cozyhydrate://app");
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "cozyhydrate",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      allowServiceWorkers: true,
      corsEnabled: true,
    },
  },
]);

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (server) server.close();
  if (process.platform !== "darwin") app.quit();
});
