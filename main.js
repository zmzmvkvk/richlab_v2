const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const csv = require('csv-parser');
const { runSelenium, getChromeDriverPath } = require('./service/selenium');
const { log } = require("electron-log");
let mainWindow;
let userData;

const createWindow = () => {
  const options = {
    width: 500,
    height: 540,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    }
  };
  mainWindow = new BrowserWindow(options);
  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools(); // 개발자 도구 열기

};

app.whenReady().then(() => {
  createWindow();

  ipcMain.on("login", (e, credentials) => {
    const { username: userid, password: userpw } = credentials;
  
    axios.post('http://3.37.68.35:4000/login', {
      userid,
      userpw
    }, {
      timeout: 10000
    }).then(response => {
      const isSuccess = response.data.success;
  
      if (isSuccess) {
        userData = response.data;

        mainWindow.loadFile(path.join(__dirname, 'page', 'selenium.html'));
      } else if (!isSuccess) {
        mainWindow.webContents.send('login-error', '아이디와 비밀번호를 확인해주세요');
      }
    })
      .catch(error => {
        log('Error:', error);
      });
  });
  
  ipcMain.on('selenium-page-loaded', async (e) => {
    try {
      e.sender.send('user-data', userData);
    } catch (error) {
      log('Error fetching user data:', error);
      e.sender.send('user-data', { error: 'Failed to fetch user data' });
    }
  });


  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  ipcMain.on("run-selenium", async (e, { filePath }) => {
    await runSelenium(filePath, userData).then(() => {
      log('크롤링 작업 완료');
    }).catch(err => {
      log('크롤링 작업 중 오류 발생:', err);
    });
  });

  ipcMain.on("get-chromedriver-path", (event) => {
    const path = getChromeDriverPath();
    event.reply("chromedriver-path", path);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

module.exports = { runSelenium };
