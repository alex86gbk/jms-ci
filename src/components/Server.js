const _ = require('lodash');
const co = require('co');

const log4js = require('log4js');
log4js.configure(require('../config').log4js);
const logger = log4js.getLogger('Server');

const database = require('../db-server');

/**
 * 查询 server 表中的单条数据
 * @param query
 * @return {Promise}
 */
const queryServerRecord = function (query) {
  return new Promise(function (resolve, reject) {
    database.server.findOne(query).exec(function (err, doc) {
      if (err) {
        logger.error(err);
        reject({
          result: {
            status: 0,
            errMsg: err.message,
          }
        });
      } else {
        resolve(doc);
      }
    });
  });
};

/**
 * 查询 server 表中的数据
 * @return {Promise}
 */
const queryServerRecords = function (query) {
  const rules = {};
  _.forEach(query, function (value, key) {
    if (value) {
      rules[key] = value;
    }
  });
  return new Promise(function (resolve, reject) {
    database.server.find(rules).sort({createdAt: -1}).exec(function (err, docs) {
      if (err) {
        logger.error(err);
        reject({
          result: {
            status: 0,
            errMsg: err.message,
          }
        });
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
const queryUploadFileRecord = function (id) {
  return new Promise(function (resolve, reject) {
    database.file.findOne({ _id: id }).exec(function (err, doc) {
      if (err) {
        logger.error(err);
        reject('');
      } else {
        if (doc) {
          resolve(doc.originalname);
        } else {
          resolve('');
        }
      }
    });
  });
};

/**
 * 更新服务器记录
 */
const updateServerRecord = function (data) {
  const record = {
    name: data.name,
    host: data.host,
    description: data.description,
    platform: data.platform,
    username: data.username,
    auth: data.auth,
    password: data.auth === 'password' ? data.password : '',
    fileId: data.auth === 'key' ? data.fileId : '',
  };
  return new Promise(function (resolve, reject) {
    database.server.update(
      { _id: data.id },
      { $set: record },
      { multi: true },
      function (err) {
        if (err) {
          logger.error(err);
          reject({
            result: {
              status: 0,
              errMsg: err.message,
            }
          });
        }
        logger.info(`更新服务器： ${data.name} ${data.host} 成功`);
        resolve({
          result: {
            status: 1,
            errMsg: '',
          }
        });
      }
    );
  });
};

/**
 * 新增服务器记录
 */
const insertServerRecord = function (data) {
  const record = data;
  record.createdAt = new Date();
  return new Promise(function (resolve, reject) {
    database.server.insert(record, function (err) {
      if (err) {
        logger.error(err);
        reject({
          result: {
            status: 0,
            errMsg: err.message,
          }
        });
      }
      logger.info(`新建服务器： ${data.name} ${data.host} 成功`);
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
const removeServerRecord = function (data) {
  return new Promise(function (resolve, reject) {
    database.server.remove({ _id: data._id }, function (err) {
      if (err) {
        logger.error(err);
        reject({
          result: {
            status: 0,
            errMsg: err.message,
          }
        });
      }
      logger.info(`删除服务器： ${data.name} ${data.host} 成功`);
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
 * 检查服务器状态
 * @param host
 * @return {Promise}
 */
const checkServerStatus = function (host) {

};

/**
 * 获取服务器列表
 * TODO 获取发布次数，在线状态
 */
function getServerList(req, res, next) {
  co(function * getServerList() {
    try {
      const data = yield queryServerRecords(req.body);
      const records = data.list;
      const list = [];
      for (let i = 0; i< records.length; i++) {
        let secretKey;
        let status;
        try {
          secretKey = yield queryUploadFileRecord(records[i].fileId);
        } catch (err) {
          secretKey = '';
        }
        list.push({
          id: records[i]._id,
          name: records[i].name,
          host: records[i].host,
          description: records[i].description,
          platform: records[i].platform,
          username: records[i].username,
          auth: records[i].auth,
          secretKey: secretKey,
          fileId: records[i].fileId,
          password: records[i].password,
          callNo: records[i].callNo,
          latestPublishAt: records[i].latestPublishAt,
          status: status,
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
 * 获取服务器下拉列表
 */
function getServerSelectList(req, res, next) {
  co(function * getServerSelectList() {
    try {
      const data = yield queryServerRecords();
      res.send({
        list: data.list.map(function (item) {
          return {
            id: item._id,
            host: item.host,
          };
        }),
      });
    } catch (err) {
      res.send(err);
    }
    next();
  });
}

/**
 * 新增，保存服务器
 */
function saveServer(req, res, next) {
  const id = req.body.id;
  co(function * saveServer() {
    if (id) {
      try {
        const result = yield updateServerRecord(req.body);
        res.send(result);
      } catch (err) {
        res.send(err);
      }
    } else {
      try {
        const result = yield insertServerRecord(req.body);
        res.send(result);
      } catch (err) {
        res.send(err);
      }
    }
    next();
  });
}

/**
 * 删除服务器
 */
function deleteServer(req, res, next) {
  const id = req.body.id;
  co(function * deleteServer() {
    if (id) {
      try {
        const record = yield queryServerRecord({
          _id: id,
        });
        if (record._id) {
          const result = yield removeServerRecord(record);
          res.send(result);
        } else {
          res.send({
            result: {
              status: 0,
              errMsg: '找不到该服务器',
            }
          });
        }
      } catch (err) {
        res.send(err);
      }
    } else {
      res.send({
        result: {
          status: 0,
          errMsg: '服务器 id 不能为空',
        }
      });
    }
    next();
  });
}

module.exports = {
  getServerList,
  getServerSelectList,
  saveServer,
  deleteServer,
};
