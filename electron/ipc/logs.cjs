module.exports = {
  name: 'logs',
  register({ ipcMain }) {
    ipcMain.handle('logs:getPath', () => '/tmp/vic.log');
  }
};
