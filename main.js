var DEBUG=true;
const electron=require('electron');
var app=electron.app, BrowserWindow=electron.BrowserWindow,screen=electron.screen;

var mainWin=null;
let tray = null
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
    if (DEBUG) mainWin.webContents.openDevTools();
    const trayContextMenu= require('./tray').trayContextMenu;
    tray = new electron.Tray('assets/img/jpg/akazure.jpg');
    tray.setToolTip('M4A1');
    tray.setContextMenu(trayContextMenu);
    console.log('hello')
});