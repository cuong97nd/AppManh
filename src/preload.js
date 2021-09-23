console.log("loaded");
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("api", {
  send: (channel, data) => {
    // レンダラーからの送信用
    ipcRenderer.send(channel, data);
  },
  sendSync: (channel, data) => {
    // レンダラーからの送信用
    return ipcRenderer.sendSync(channel, data);
  },
  on: (channel, func) => {
    // メインプロセスからの受信用
    ipcRenderer.on(channel, (event, args) => func(args));
  },
});
