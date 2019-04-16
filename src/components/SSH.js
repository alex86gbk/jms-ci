const path = require('path');

const co = require('co');
const spawn = require('cross-spawn');

const node_ssh = require('node-ssh');
const ssh = new node_ssh();

const log4js = require('log4js');
log4js.configure(require('../config').log4js);
const logger = log4js.getLogger('SSH');

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
        logger.error(err);
        reject('');
      } else {
        if (doc) {
          resolve(path.join(process.cwd(), '_upload', doc.filename));
        } else {
          resolve('');
        }
      }
    });
  });
};

/**
 * 链接到服务器
 * @param server
 * @return {*}
 */
function connectToServer(server) {
  return co.wrap(function * connectToServer(server) {
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
    return new Promise(function (resolve, reject) {
      connect.readyTimeout = 5000;
      ssh.connect(connect).then(function () {
        resolve({
          ssh,
          result: {
            status: 1,
            errMsg: '',
          }
        });
      }).catch(function (err) {
        logger.error(err);
        reject({
          result: {
            status: 0,
            errMsg: err.message,
          }
        })
      });
    });
  })(server);
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
      }
    }).then(function(status) {
      if (!status) {
        logger.error('Transfers UNSUCCESSFUL!\n' + failed.join('\n'));
        logger.error('Will transfer again after 5 seconds !\n');
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
  connectToServer,
  cleanRemotePath,
  transfersToRemote,
};
