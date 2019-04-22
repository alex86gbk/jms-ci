#!/usr/bin/env node --harmony

const path = require('path');
const fs = require('fs');

const co = require('co');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const timeout = require('connect-timeout');
const bodyParser = require('body-parser');
const opn = require('opn');

const config = require('./src/config');

const log4js = require('./src/log4js');
const defaultLogger = log4js.getLogger('default');
const debugLogger = log4js.getLogger('debug');

const common = require('./src/routers/common');

/**
 * 异常处理
 * @param err
 * @param req
 * @param res
 * @param next
 */
function errHandler(err, req, res, next) {
  debugLogger.debug("Something went wrong: ", err);
  res.status(500).send('Something broke!');
  next();
}

/**
 * 超时处理
 * @param req
 * @param res
 * @param next
 */
function timeOutHandler(req, res, next) {
  if (!req.timedout) next();
}

/**
 * 初始化上传路径
 * @return {Promise}
 */
function initUploadPath() {
  const uploadPath = path.join(__dirname, '_upload');
  const existUploadPath = fs.existsSync(path.join(uploadPath));

  if (!existUploadPath) {
    fs.mkdirSync(uploadPath);
    return Promise.resolve(true);
  } else {
    return Promise.resolve(true);
  }
}

/**
 * 初始化 express
 */
function initExpressApp() {
  return new Promise(function (resolve) {
    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/upload', express.static(path.join(__dirname, '_upload')));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(timeout(config.TIME_OUT));
    app.use(timeOutHandler);
    app.use(errHandler);

    try {
      http.listen(config.PORT);
      defaultLogger.info('JMS-CI Started On Port:' + config.PORT);
      opn(`http://localhost:${config.PORT}/project.html`);
    } catch (err) {
      debugLogger.debug("Listen went wrong: ",err);
    }

    resolve();
  });
}

/**
 * 激活路由
 */
function routers() {
  app.all('*', function(req, res, next) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });
  app.use('/common', common);
}

co(function *() {
  yield initUploadPath();
  yield initExpressApp();
  routers();
});
