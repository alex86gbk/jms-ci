const fs = require('fs');
const path = require('path');

const log4js = require('../log4js');
const debugLogger = log4js.getLogger('debug');

/**
 * 查看错误日志
 */
function getErrorLog(req, res, next) {
  try {
    const logFile = fs.readFileSync(path.join(__dirname, '../../_logs/errors.log'), { encoding: 'utf8' });
    res.send({
      result: {
        status: 1,
        errMsg: logFile,
      },
    });
  } catch (err) {
    debugLogger.debug('[Logger]: ' + err);
    res.send({
      result: {
        status: 0,
        errMsg: err.message,
      },
    });
  }
  next();
}

module.exports = {
  getErrorLog,
};
