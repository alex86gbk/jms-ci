const fs = require('fs');
const path = require('path');

const PORT = 11234;
const TIME_OUT = 30 * 1e3;

const log4js = {
  appenders: {
    app: {
      type: 'file',
      filename: path.join(process.cwd(), '_logs', 'app.log'),
      maxLogSize: 10485760,
      numBackups: 3
    },
    errorFile: {
      type: 'file',
      filename: path.join(process.cwd(), '_logs', 'errors.log')
    },
    errors: {
      type: 'logLevelFilter',
      level: 'ERROR',
      appender: 'errorFile'
    }
  },
  categories: {
    default: {
      appenders: ['app', 'errors'],
      level: 'TRACE',
    },
  },
};

module.exports = {
  PORT: PORT,
  TIME_OUT: TIME_OUT,
  log4js: log4js,
};
