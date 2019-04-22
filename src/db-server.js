const path = require('path');
const DataStore = require('nedb');

const log4js = require('./log4js');
const debugLogger = log4js.getLogger('debug');

const DB_DIR = '../_db';

const db = {
  project: new DataStore({
    filename: path.join(__dirname, DB_DIR, 'project.db'),
    autoload: true,
  }),
  server: new DataStore({
    filename: path.join(__dirname, DB_DIR, 'server.db'),
    autoload: true,
  }),
  file: new DataStore({
    filename: path.join(__dirname, DB_DIR, 'file.db'),
    autoload: true,
  }),
};

/**
 * 错误处理
 */
function handleError(err) {
  if (err) {
    debugLogger.debug('[db-server]: ' + err);
  }
}

db.project.ensureIndex({ fieldName: 'localPath', unique: true }, handleError);
db.project.ensureIndex({ fieldName: 'createdAt' }, handleError);
db.server.ensureIndex({ fieldName: 'host', unique: true }, handleError);
db.server.ensureIndex({ fieldName: 'createdAt' }, handleError);

module.exports = db;
