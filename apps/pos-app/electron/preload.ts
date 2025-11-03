import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  printEscPos: (commands: string[]) => ipcRenderer.invoke('print:escpos', commands),
  printZpl: (commands: string[]) => ipcRenderer.invoke('print:zpl', commands),
  appendOffline: (record: { id: string; payload: unknown }) => ipcRenderer.invoke('offline:append', record),
  listOffline: () => ipcRenderer.invoke('offline:list'),
  clearOffline: (id: string) => ipcRenderer.invoke('offline:clear', id),
  saveCartSnapshot: (payload: unknown) => ipcRenderer.invoke('offline:save-cart', payload),
  loadCartSnapshot: () => ipcRenderer.invoke('offline:load-cart')
});
