const PIDS = { rpm: { mode: '01', pid: '0C', bytes: 2, decode: (b) => parseInt(b, 16) } };

module.exports = {
  name: 'obd',
  register({ ipcMain, broadcast }) {
    ipcMain.handle('obd:connect', () => ({}));
    ipcMain.handle('obd:disconnect', () => ({}));
    ipcMain.handle('obd:status', () => ({ connected: false }));
    ipcMain.handle('obd:readDTCs', () => []);
  }
};
