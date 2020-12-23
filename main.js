const electron=require('electron')
var app=electron.app, BrowserWindow=electron.BrowserWindow,screen=electron.screen;

var mainWin=null;
var localModelPath=process.cwd()+"/renderer/";
// require('./tray.js');
let tray = null
electron.ipcMain.on('require-model-path',(event,arg)=>{
  console.log('require-model-path')
  event.reply('offer-model-path',localModelPath)})
app.on('ready',()=>{
    mainWin=new BrowserWindow({
        width:500,
        height:500,
        center:false,
        x:screen.getPrimaryDisplay().workAreaSize.width-500,
        y:screen.getPrimaryDisplay().workAreaSize.height-500,
        // skipTaskbar:true,
        // alwaysOnTop:true,
        // frame:false,
        // backgroundColor:'#00FF00FF',
        // transparent:true,
        webPreferences:{
          nodeIntegration:true,
          enableRemoteModule:true
        }
    });
    mainWin.loadFile('index.html');
    mainWin.on('close',()=>{
        mainWin=null;
    })
    const trayContextMenu = electron.Menu.buildFromTemplate([
        {
          label:'加载其他模型',
          click:()=>{
            electron.dialog.showOpenDialog({
              title:'选择模型',
              filters:[
                {name:'live2d模型文件',extensions:['json']}
              ]
            }).then(result=>{
              if(!result.canceled){
                console.log(result.filePaths[0])
                localModelPath=result.filePaths[0]
                mainWin.reload();
              }
            }).catch(err=>{
              console.log(err)
            })
          }
        },
        {
            label:'退出',
            role:'quit'
        }
      ]);
    tray = new electron.Tray('assets/img/jpg/akazure.jpg');
    tray.setToolTip('M4A1');
    tray.setContextMenu(trayContextMenu);
    console.log('hello')
});