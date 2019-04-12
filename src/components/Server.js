const _ = require('lodash');
const co = require('co');
const database = require('../db-server');

/**
 * 查询 server 表中的数据
 * @return {Promise}
 */
const queryServerData = function (query) {
  return new Promise(function (resolve, reject) {
    database.server.find(query).sort({createdAt: -1}).exec(function (err, docs) {
      if (err) {
        reject();
      } else {
        resolve(docs);
      }
    });
  });
};

/**
 * 获取服务器列表
 */
function getServerList(req, res, next) {
  co(function * getServerSelectList() {
    const data = yield queryServerData(req.body);
    res.send({
      list: data,
    });
    next();
  });
}

/**
 * 获取服务器下拉列表
 */
function getServerSelectList(req, res, next) {
  co(function * getServerSelectList() {
    const data = yield queryServerData();
    res.send({
      list: data.map(function (item) {
        return {
          id: item.id,
          host: item.host,
        };
      }),
    });
    next();
  });
}

/**
 * 新增，保存服务器
 */
function saveServer(req, res, next) {

}

/**
 * 删除服务器
 */
function deleteServer(req, res, next) {

}

module.exports = {
  getServerList,
  getServerSelectList,
  saveServer,
  deleteServer,
};
