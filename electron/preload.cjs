const { contextBridge, ipcRenderer } = require('electron');

const vic = {
  // stub for bridge
  system: {
    startStream: () => {},
    stopStream: () => {},
  },
  obd: {
    connect: () => Promise.resolve({}),
    disconnect: () => Promise.resolve({}),
    getStatus: () => Promise.resolve({}),
    readDTCs: () => Promise.resolve([]),
  },
  // add more as needed
};

contextBridge.exposeInMainWorld('vic', vic);
contextBridge.exposeInMainWorld('vicWindow', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
});

module.exports = {};
