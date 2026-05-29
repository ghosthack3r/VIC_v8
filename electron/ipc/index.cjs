const fs = require('./fs.cjs');
const apps = require('./apps.cjs');
const processes = require('./processes.cjs');
const system = require('./system.cjs');
const windows = require('./windows.cjs');
const notifications = require('./notifications.cjs');
const logs = require('./logs.cjs');
const obd = require('./obd.cjs');
const gemini = require('./gemini.cjs');
const commandRouter = require('./command-router.cjs');
const vehicleData = require('./vehicle-data.cjs');
const carplay = require('./carplay.cjs');
const agent = require('./agent.cjs');

const modules = [
  fs, apps, processes, system, windows, notifications, logs, obd, gemini, commandRouter, vehicleData, carplay, agent
];

function registerHandlers(ctx) {
  for (const mod of modules) {
    try {
      if (mod && typeof mod.register === 'function') {
        mod.register(ctx);
        console.log(`[ipc] registered ${mod.name || 'unnamed'}`);
      }
    } catch (e) {
      console.error(`[ipc] failed to register ${mod.name || 'module'}`, e.message);
    }
  }
}

module.exports = { registerHandlers };
