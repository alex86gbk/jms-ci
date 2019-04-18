const path = require('path');
const DataStore = require('nedb');

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
  })
};

db.project.ensureIndex({ fieldName: 'localPath', unique: true }, function (err) {});
db.project.ensureIndex({ fieldName: 'createdAt' }, function (err) {});
db.server.ensureIndex({ fieldName: 'host', unique: true }, function (err) {});
db.server.ensureIndex({ fieldName: 'createdAt' }, function (err) {});

module.exports = db;
