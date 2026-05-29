module.exports = {
  name: 'fs',
  register({ ipcMain, permissions }) {
    ipcMain.handle('fs:readFile', async (e, p) => {
      await permissions.check('fs:read', { summary: 'Read file' });
      return { content: 'stub' };
    });
    // add more handlers as needed
  }
};
