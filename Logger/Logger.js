const util = require('util');

class Logger {
  static log(...args) {
    console.log(`[LOG] ${new Date().toISOString()}:`, util.format(...args));
  }

  static info(...args) {
    console.info(`[INFO] ${new Date().toISOString()}:`, util.format(...args));
  }

  static warn(...args) {
    console.warn(`[WARN] ${new Date().toISOString()}:`, util.format(...args)); 
  }

  static debug(...args) {
    console.debug(`[DEBUG] ${new Date().toISOString()}:`, util.format(...args));
  }

  static error(...args) {
    console.error(`[ERROR] ${new Date().toISOString()}:`, util.format(...args));
  }
}

module.exports = Logger;