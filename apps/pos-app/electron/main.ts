import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import log from 'electron-log';
import Database from 'better-sqlite3';

const isDev = !app.isPackaged;
const dbPath = path.join(app.getPath('userData'), 'register-offline.db');
const db = new Database(dbPath);

db.exec(
  `CREATE TABLE IF NOT EXISTS journal (id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
   CREATE TABLE IF NOT EXISTS cart_snapshot (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT);
   INSERT OR IGNORE INTO cart_snapshot (id, payload) VALUES (1, '[]');`
);

async function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    backgroundColor: '#050505',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    await window.loadURL('http://localhost:5173');
    window.webContents.openDevTools();
  } else {
    await window.loadFile(path.join(__dirname, '../web/index.html'));
  }
}

ipcMain.handle('print:escpos', async (_event, commands: string[]) => {
  log.info('ESC/POS print job', commands);
});

ipcMain.handle('print:zpl', async (_event, commands: string[]) => {
  log.info('ZPL print job', commands);
});

ipcMain.handle('offline:append', (_event, record: { id: string; payload: unknown }) => {
  const stmt = db.prepare('INSERT INTO journal (id, payload) VALUES (?, ?)');
  stmt.run(record.id, JSON.stringify(record.payload));
  log.info('Offline journal appended', record.id);
});

ipcMain.handle('offline:list', () => {
  const stmt = db.prepare('SELECT id, payload, created_at FROM journal ORDER BY created_at ASC');
  return stmt.all();
});

ipcMain.handle('offline:clear', (_event, id: string) => {
  const stmt = db.prepare('DELETE FROM journal WHERE id = ?');
  stmt.run(id);
});

ipcMain.handle('offline:save-cart', (_event, payload: unknown) => {
  const stmt = db.prepare('UPDATE cart_snapshot SET payload = ? WHERE id = 1');
  stmt.run(JSON.stringify(payload));
});

ipcMain.handle('offline:load-cart', () => {
  const stmt = db.prepare('SELECT payload FROM cart_snapshot WHERE id = 1');
  const row = stmt.get();
  return row?.payload ? JSON.parse(row.payload as string) : [];
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
