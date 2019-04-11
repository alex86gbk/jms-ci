const co = require('co');
const database = require('../db-server');

/**
 * 查询 project 表中的数据
 * @return {Promise}
 */
const queryProjectData = function () {
  return new Promise(function (resolve, reject) {
    database.project.find({}).sort({createdAt: -1}).exec(function (err, docs) {
      if (err) {
        reject();
      } else {
        resolve(docs);
      }
    });
  });
};

/**
 * 获取项目列表
 */
function getProjectList(req, res, next) {
  co(function * getProjectList() {
    const data = yield queryProjectData();
    res.send({
      list: data,
    });
    next();
  });
}

/**
 * 新增，保存项目
 */
function saveProject(req, res, next) {

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

}

module.exports = {
  getProjectList,
  saveProject,
  packageProject,
  publishProject,
  deleteProject,
};
