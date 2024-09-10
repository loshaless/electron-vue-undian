import { ipcMain } from 'electron';

export function setupIpcHandlers() {
  // Listen for messages from the renderer process
  ipcMain.on('channel-name', (event, data) => {
    console.log('Received data:', data);
    // You can send a response back to the renderer process if needed
    event.reply('channel-name-reply', 'Received your data');
  });

  // Add other IPC handlers here
}