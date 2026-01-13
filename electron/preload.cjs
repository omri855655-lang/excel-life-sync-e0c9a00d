// Preload script for Electron
// This runs in a context that has access to both the renderer and Node.js

const { contextBridge } = require('electron');

// Expose any APIs to the renderer process here
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
});
