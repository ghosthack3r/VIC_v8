module.exports = {
  name: 'windows',
  register({ ipcMain }) {
    ipcMain.handle('windows:list', () => []);
    ipcMain.handle('windows:focus', (e, h) => ({}));
  }
};
