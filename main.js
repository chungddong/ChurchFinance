const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  })

  // 사용자 데이터 디렉토리 설정
  const userDataPath = app.getPath('userData');
  const dataDir = path.join(userDataPath, 'data');
  
  // 데이터 디렉토리가 없으면 생성
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // 초기 JSON 파일들이 없으면 생성
  const files = ['members.json', 'donations.json', 'expenses.json'];
  files.forEach(filename => {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf8');
    }
  });
  
  // 전역 변수로 데이터 경로 설정
  global.userDataPath = dataDir;

  mainWindow.loadFile('index.html')
  //mainWindow.webContents.openDevTools() // 개발자 도구 열기
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

