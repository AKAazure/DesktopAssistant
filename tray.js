const { app, Menu, Tray, dialog, ipcMain, ipcRenderer } = require('electron')

let tray = null
var event=new Event('local-model-has-been-selected')
app.dispatchEvent(event)
const trayContextMenu = Menu.buildFromTemplate([
  {
    label:'load',
    click:()=>{
      dialog.showOpenDialog({
        title:'选择模型',
        filters:[
          {name:'live2d模型文件',extensions:['json']}
        ]
      }).then(result=>{
        if(!result.canceled){
          console.log(result.filePaths[0])
          // localModelPath=result.filePaths[0]
          // mainWin.reload();
          var event=new Event('local-model-has-been-selected')
          app.dispatchEvent(event)
        }
      }).catch(err=>{
        console.log(err)
      })
    }
  },
  {
      label:'exit',
      role:'quit'
  }
]);
app.whenReady().then(() => {
  tray = new Tray('assets/img/jpg/akazure.jpg');
  tray.setToolTip('This is my application.');
  tray.setContextMenu(trayContextMenu);
})