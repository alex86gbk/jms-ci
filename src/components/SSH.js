const path = require('path');

const co = require('co');

const node_ssh = require('node-ssh');
const ssh = new node_ssh();

const log4js = require('../log4js');
const debugLogger = log4js.getLogger('debug');

const database = require('../db-server');

/**
 * 获取秘钥文件路径
 * @param {String} id
 * @return {Promise | String}
 */
const getPrivateKey = function (id) {
  return new Promise(function (resolve, reject) {
    database.file.findOne({ _id: id }).exec(function (err, doc) {
      if (err) {
        debugLogger.debug(err);
        reject('');
      } else {
        if (doc) {
          resolve(path.join(__dirname, '../../_upload', doc.filename));
        } else {
          resolve('');
        }
      }
    });
  });
};

/**
 * 获取连接信息
 */
function getConnect(server) {
  return co.wrap(function * getConnect(server) {
    let connect;
    let secretKey;
    if (server.auth === 'password') {
      connect = {
        host: server.host,
        username: server.username,
        password: server.password,
      };
    } else {
      try {
        secretKey = yield getPrivateKey(server.fileId);
      } catch (err) {
        secretKey = '';
      }
      connect = {
        host: server.host,
        username: server.username,
        privateKey: secretKey,
      };
    }
    return connect;
  })(server);
}

/**
 * 链接到服务器
 * @param connect
 * @return {*}
 */
function connectToServer(connect) {
  return co.wrap(function * connectToServer(connect) {
    return new Promise(function (resolve, reject) {
      connect.readyTimeout = 5000;
      ssh.connect(connect).then(function () {
        resolve({
          ssh,
          result: {
            status: 1,
            errMsg: '',
          },
        });
      }).catch(function (err) {
        debugLogger.debug(connect.host + err);
        reject({
          result: {
            status: 0,
            errMsg: err.message,
          },
        })
      });
    });
  })(connect);
}

/**
 * 断开连接
 */
function disconnectFromServer(ssh) {
  return new Promise(function (resolve) {
    try {
      ssh.dispose();
      resolve();
    } catch (err) {
      debugLogger.debug(err);
      resolve();
    }
  });
}

/**
 * 清理远程目录
 * @param ssh
 * @param project
 * @return {Promise}
 */
function cleanRemotePath(ssh, project) {
  return new Promise(function (resolve) {
    ssh.exec('rm -rf ' + project.remotePath).then(resolve);
  });
}

/**
 * 传输数据
 * @param ssh
 * @param project
 * @param server
 * @return {Promise | void}
 */
function transfersToRemote(ssh, project, server) {
  const failed = [];
  const successful = [];

  return new Promise(function (resolve) {
    ssh.putDirectory(path.join(project.localPath, 'dist'), project.remotePath, {
      recursive: true,
      concurrency: 1,
      tick: function(localPath, remotePath, error) {
        if (error) {
          failed.push(localPath)
        } else {
          successful.push(localPath)
        }
      },
    }).then(function(status) {
      if (!status) {
        debugLogger.debug('Transfers UNSUCCESSFUL!\n' + failed.join('\n'));
        debugLogger.debug('Will transfer again after 5 seconds !\n');
        setTimeout(function () {
          transfersToRemote(ssh, project, server);
        }, 5000);
      } else {
        resolve();
      }
    })
  });
}

module.exports = {
  getConnect,
  connectToServer,
  cleanRemotePath,
  transfersToRemote,
  disconnectFromServer,
};
