const co = require('co');

const log4js = require('log4js');
log4js.configure(require('../config').log4js);
const logger = log4js.getLogger('Project');

const database = require('../db-server');
const SSH = require('./SSH');

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
 * 查询 project 表中的单条数据
 * @param query
 * @return {Promise}
 */
const queryProjectRecord = function (query) {
  return new Promise(function (resolve, reject) {
    database.project.findOne(query).exec(function (err, doc) {
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
 * 查询 project 表中的数据
 * @return {Promise}
 */
const queryProjectRecords = function () {
  return new Promise(function (resolve, reject) {
    database.project.find({}).sort({ createdAt: -1 }).exec(function (err, docs) {
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
          resolve('/upload/' + doc.filename);
        } else {
          resolve('');
        }
      }
    });
  });
};

/**
 * 更新服务器状态
 * @param data
 */
const updateServerStatus = function (data) {
  const record = {
    latestPublishAt: data.latestPublishAt,
  };
  return new Promise(function (resolve, reject) {
    database.server.update(
      { _id: data.id },
      { $set: record, $inc: { callNo: 1 } },
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
        resolve();
      }
    );
  });
};

/**
 * 更新项目状态
 */
const updateProjectStatus = function (data) {
  const record = {
    isPackaging: data.isPackaging,
    isPublishing: data.isPublishing,
  };
  return new Promise(function (resolve, reject) {
    database.project.update(
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
        resolve();
      }
    );
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
      logger.info(`更新项目： ${data.name} ${data.localPath} 成功`);
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
      logger.info(`新建项目： ${data.name} ${data.localPath} 成功`);
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
    database.project.remove({ _id: data._id }, function (err) {
      if (err) {
        logger.error(err);
        reject({
          result: {
            status: 0,
            errMsg: err.message,
          }
        });
      }
      logger.info(`删除项目： ${data.name} ${data.localPath} 成功`);
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
 * 运行打包
 */
const runBuild = function (project) {
  return new Promise(function (resolve, reject) {
    const command = spawn('npm', ['run', 'build'], {
      cwd: project.localPath,
    });
    command.stdout.on('data', function() {
      resolve({
        result: {
          status: 1,
          errMsg: '',
        }
      });
    });
    command.stderr.on('data', function(data) {
      reject({
        result: {
          status: 0,
          errMsg: data.toString(),
        }
      });
    });
    command.on('close', function() {
      updateProjectStatus({
        id: project._id,
        isPackaging: false,
        isPublishing: false,
      });
      resolve();
    });
    command.on('error', function(err) {
      logger.error(err.toString());
      reject({
        result: {
          status: 0,
          errMsg: err.toString(),
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
        let icon;
        try {
          icon = yield queryUploadFileRecord(records[i].fileId);
        } catch (err) {
          icon = '';
        }
        list.push({
          id: records[i]._id,
          name: records[i].name,
          icon: icon,
          localPath: records[i].localPath,
          remotePath: records[i].remotePath,
          description: records[i].description,
          fileId: records[i].fileId,
          isPackaging: records[i].isPackaging,
          isPublishing: records[i].isPublishing,
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
      try {
        const result = yield updateProjectRecord(req.body);
        res.send(result);
      } catch (err) {
        res.send(err);
      }
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
  const id = req.body.id;
  co(function * deleteProject() {
    if (id) {
      try {
        const record = yield queryProjectRecord({
          _id: id,
        });
        if (record._id) {
          yield updateProjectStatus({
            id,
            isPackaging: true,
            isPublishing: false,
          });
          const result = yield runBuild(record);
          res.send(result);
        } else {
          res.send({
            result: {
              status: 0,
              errMsg: '找不到该项目',
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
          errMsg: '项目 id 不能为空',
        }
      });
    }
    next();
  });
}

/**
 * 发布项目
 */
function publishProject(req, res, next) {
  const projectId = req.body.projectId;
  const serverId = req.body.serverId;
  co(function * deleteProject() {
    if (projectId && serverId) {
      try {
        const project = yield queryProjectRecord({
          _id: projectId,
        });
        const server = yield queryServerRecord({
          _id: serverId,
        });
        if (project._id && server._id) {
          const { ssh, result } = yield SSH.connectToServer(server);
          yield updateProjectStatus({
            id: projectId,
            isPackaging: false,
            isPublishing: true,
          });
          res.send({
            result,
          });
          yield SSH.cleanRemotePath(ssh, project);
          yield SSH.transfersToRemote(ssh, project, server);
          updateProjectStatus({
            id: project._id,
            isPackaging: false,
            isPublishing: false,
          });
          updateServerStatus({
            id: server._id,
            latestPublishAt: Date.now(),
          });
        } else {
          res.send({
            result: {
              status: 0,
              errMsg: '找不到该项目或服务器',
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
          errMsg: '项目或服务器 id 不能为空',
        }
      });
    }
    next();
  });
}

/**
 * 删除项目
 */
function deleteProject(req, res, next) {
  const id = req.body.id;
  co(function * deleteProject() {
    if (id) {
      try {
        const record = yield queryProjectRecord({
          _id: id,
        });
        if (record._id) {
          const result = yield removeProjectRecord(record);
          res.send(result);
        } else {
          res.send({
            result: {
              status: 0,
              errMsg: '找不到该项目',
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
