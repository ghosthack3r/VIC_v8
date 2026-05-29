module.exports = {
  name: 'gemini',
  register({ ipcMain, broadcast }) {
    ipcMain.handle('gemini:sendAudio', () => ({}));
    ipcMain.handle('gemini:sendFunctionResponse', () => ({}));
  }
};
