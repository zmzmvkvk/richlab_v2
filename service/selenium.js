const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');
const os = require('os');

let chromeDriverPath;

if (process.env.NODE_ENV === 'production') {
  chromeDriverPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'chromedriver', 'lib', 'chromedriver');
  // if (os.platform() === 'win32' || os.platform() === 'win64') {
  //   chromeDriverPath += '.exe';
  // }
} else {
  chromeDriverPath = require('chromedriver').path.replace('app.asar', 'app.asar.unpacked');
}

const getChromeDriverPath = () => {
  return chromeDriverPath;
};

const runSelenium = async (filePath) => {
  const fileCsv = fs.readFileSync(filePath).toString('utf-8');
  
  try {
    const urls = fileCsv.split(/\n|\r/);
    let options = new chrome.Options();
    let serviceBuilder = new chrome.ServiceBuilder(chromeDriverPath);
    let driver = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .setChromeService(serviceBuilder)
      .build();

    for (let url of urls) {
      try {
        await driver.get(url);
        console.log(`Successfully visited ${url}`);
      } catch (error) {
        console.error(`Error visiting ${url}:`, error);
      }
    }

  } catch (error) {
    console.error('Error reading CSV file:', error);
  } finally {
    await driver.quit();
  }
};

module.exports = { runSelenium, getChromeDriverPath };
