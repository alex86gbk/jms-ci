const path = require('path');
const multer  = require('multer');
const co = require('co');

const log4js = require('../log4js');
const defaultLogger = log4js.getLogger('default');
const debugLogger = log4js.getLogger('debug');

const database = require('../db-server');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../_upload'))
  },
  filename: function (req, file, cb) {
    filename = renameFile(file.originalname);
    cb(null, filename);
  },
});
const upload = multer({ storage }).single('file');

/**
 * 错误上传处理
 * @param err
 * @param res
 * @param next
 */
const handleUploadError = function (err, res, next) {
  if (err instanceof multer.MulterError) {
    debugLogger.debug(multer.MulterError);
    res.send({
      result: {
        status: 0,
        errMsg: 'A Multer error occurred when uploading',
      },
    });
  } else if (err) {
    debugLogger.debug(err);
    res.send({
      result: {
        status: 0,
        errMsg: err.message,
      },
    });
  }
  next();
};

/**
 * 新增文件
 */
const insertFileData = function (data) {
  const record = {
    originalname: data.originalname,
    mimetype: data.mimetype,
    filename: filename,
    size: data.size,
  };
  return new Promise(function (resolve, reject) {
    database.file.insert(record, function (err, doc) {
      if (err) {
        debugLogger.debug(err);
        reject({
          result: {
            status: 0,
            errMsg: err.message,
          },
        });
      }
      defaultLogger.info(`上传文件 ${filename} 成功`);
      resolve({
        result: {
          status: 1,
          errMsg: '',
          fileId: doc._id,
        },
      });
    });
  });
};

/**
 * 重命名文件
 * @param originalName
 * @return {String}
 */
const renameFile = function (originalName) {
  const names = originalName.split('.');
  const extension = names.pop();

  return (names.length > 1 ? names.join('.') + '-' : '') + Date.now() + '.' + extension;
};

let filename;

/**
 * 上传文件
 */
function uploadFile(req, res, next) {
  upload(req, res, function (err) {
    if (err) {
      handleUploadError(err, res, next);
    }
    co(function * uploadFile() {
      try {
        const data = yield insertFileData(req.file);
        res.send(data);
      } catch (err) {
        res.send(err);
      }
      next();
    });
  });
}

module.exports = {
  uploadFile,
};
