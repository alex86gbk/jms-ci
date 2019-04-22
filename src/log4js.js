const fs = require('fs');
const path = require('path');

const log4js = require('log4js');

const config = {
  appenders: {
    app: {
      type: 'file',
      filename: path.join(__dirname, '../_logs', 'app.log'),
      maxLogSize: 10485760,
      numBackups: 3,
    },
    errorFile: {
      type: 'file',
      filename: path.join(__dirname, '../_logs', 'errors.log'),
    },
    errors: {
      type: 'logLevelFilter',
      level: 'ERROR',
      appender: 'errorFile',
    },
    debugFile: {
      type: 'file',
      filename: path.join(__dirname, '../_logs', 'debugs.log'),
    },
    debugs: {
      type: 'logLevelFilter',
      level: 'DEBUG',
      appender: 'debugFile',
    },
  },
  categories: {
    default: {
      appenders: ['app'],
      level: 'TRACE',
    },
    error: {
      appenders: ['errors'],
      level: 'ERROR',
    },
    debug: {
      appenders: ['debugs'],
      level: 'DEBUG',
    },
  },
};

log4js.configure(config);

/**
 * 使用日志
 */
function getLogger(name) {
  return log4js.getLogger(name || 'default');
}

module.exports = {
  getLogger,
};
