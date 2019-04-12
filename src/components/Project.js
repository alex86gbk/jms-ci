const _ = require('lodash');
const co = require('co');

const log4js = require('log4js');
log4js.configure(require('../config').log4js);
const logger = log4js.getLogger('Project');

const database = require('../db-server');

/**
 * 查询 project 表中的数据
 * @return {Promise}
 */
const queryProjectRecords = function () {
  return new Promise(function (resolve, reject) {
    database.project.find({}).sort({ createdAt: -1 }).exec(function (err, docs) {
      if (err) {
        reject(err);
      } else {
        resolve({
          list: docs,
        });
      }
    });
  });
};

/**
 * 查询 file 表中的数据
 * @param {String} id
 * @return {Promise | String}
 */
const queryUploadFileRecords = function (id) {
  return new Promise(function (resolve, reject) {
    database.file.findOne({ _id: id }).exec(function (err, doc) {
      if (err) {
        reject(err);
      } else {
        if (doc) {
          resolve('/upload/' + doc.filename);
        } else {
          resolve('');
        }
      }
    });
  });
};

/**
 * 更新项目记录
 */
const updateProjectRecord = function (data) {
  const record = {
    name: data.name,
    description: data.description,
    localPath: data.localPath,
    remotePath: data.remotePath,
    fileId: data.fileId,
  };
  return new Promise(function (resolve, reject) {
    database.project.update({ _id: data.id }, record, function (err) {
      if (err) {
        logger.error(err);
        reject({
          result: {
            status: 0,
            errMsg: err.message,
          }
        });
      }
      logger.info(`更新项目 ${data.name} ${data.localPath} 成功`);
      resolve({
        result: {
          status: 1,
          errMsg: '',
        }
      });
    });
  });
};

/**
 * 新增项目记录
 */
const insertProjectRecord = function (data) {
  const record = data;
  record.createdAt = new Date();
  return new Promise(function (resolve, reject) {
    database.project.insert(record, function (err) {
      if (err) {
        logger.error(err);
        reject({
          result: {
            status: 0,
            errMsg: err.message,
          }
        });
      }
      logger.info(`新建项目 ${data.name} ${data.localPath} 成功`);
      resolve({
        result: {
          status: 1,
          errMsg: '',
        }
      });
    });
  });
};

/**
 * 删除项目记录
 */
const removeProjectRecord = function (data) {
  return new Promise(function (resolve, reject) {
    database.project.remove({ _id: data.id }, function (err) {
      if (err) {
        logger.error(err);
        reject({
          result: {
            status: 0,
            errMsg: err.message,
          }
        });
      }
      logger.info(`删除项目 ${data.name} ${data.localPath} 成功`);
      resolve({
        result: {
          status: 1,
          errMsg: '',
        }
      });
    });
  });
};

/**
 * 获取项目列表
 */
function getProjectList(req, res, next) {
  co(function * getProjectList() {
    try {
      const data = yield queryProjectRecords();
      const records = data.list;
      const list = [];
      for (let i = 0; i< records.length; i++) {
        list.push({
          id: records[i]._id,
          name: records[i].name,
          icon: records[i].fileId ? yield queryUploadFileRecords(records[i].fileId) : '',
          localPath: records[i].localPath,
          remotePath: records[i].remotePath,
          description: records[i].description,
          fileId: records[i].fileId,
        });
      }
      res.send({
        list,
      });
    } catch (err) {
      res.send(err);
    }
    next();
  });
}

/**
 * 新增，保存项目
 */
function saveProject(req, res, next) {
  const id = req.body.id;
  co(function * saveProject() {
    if (id) {
      const result = yield updateProjectRecord(req.body);
      res.send(result);
    } else {
      try {
        const result = yield insertProjectRecord(req.body);
        res.send(result);
      } catch (err) {
        res.send(err);
      }
    }
    next();
  });
}

/**
 * 打包项目
 */
function packageProject(req, res, next) {

}

/**
 * 发布项目
 */
function publishProject(req, res, next) {

}

/**
 * 删除项目
 */
function deleteProject(req, res, next) {
  const id = req.body.id;
  co(function * deleteProject() {
    if (id) {
      const result = yield removeProjectRecord(req.body);
      res.send(result);
    } else {
      res.send({
        result: {
          status: 0,
          errMsg: '项目 id 不能为空',
        }
      });
    }
    next();
  });
}

module.exports = {
  getProjectList,
  saveProject,
  packageProject,
  publishProject,
  deleteProject,
};
