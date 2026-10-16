const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('node:path');
const { spawn } = require('node:child_process');

const PORT = 4000;
const SERVER_URL = `http://localhost:${PORT}/`;
const BACKEND_ENTRY = path.join(__dirname, '..', 'backend', 'src', 'server.js');

let backendProcess = null;
let mainWindow = null;

// Electron trae su propio Node interno (más antiguo que el del sistema y sin
// node:sqlite), así que el backend se lanza con el Node real instalado en la
// máquina (el mismo que usa `npm run dev` en backend/), no con `fork`.
function startBackend() {
  const nodeBin = process.platform === 'win32' ? 'node.exe' : 'node';
  backendProcess = spawn(nodeBin, [BACKEND_ENTRY], {
    env: { ...process.env, PORT: String(PORT), ELECTRON_RUN_AS_NODE: '' },
    stdio: 'inherit',
    windowsHide: true,
  });
  backendProcess.on('error', (err) => {
    dialog.showErrorBox(
      'No se encontró Node.js',
      `No se pudo iniciar la API porque no se encontró "node" en el PATH del sistema.\n\nInstala Node.js 22.5+ y vuelve a intentar.\n\n${err.message}`
    );
    app.quit();
  });
  backendProcess.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`El proceso de la API terminó inesperadamente (código ${code})`);
    }
  });
}

async function waitForBackend(timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`${SERVER_URL}api/health`);
      if (res.ok) return true;
    } catch {
      // el servidor aún no está listo, reintenta
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('La API no respondió a tiempo');
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'Mis Finanzas — Control de gastos',
    backgroundColor: '#f9f9f7',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Los enlaces externos (si algún día los hay) se abren en el navegador del sistema.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  await waitForBackend();
  await mainWindow.loadURL(SERVER_URL);
}

app.whenReady().then(async () => {
  startBackend();
  try {
    await createWindow();
  } catch (err) {
    console.error('No se pudo iniciar la aplicación:', err);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});
