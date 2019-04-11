const path = require('path');

const express = require('express');
const app = express();
const http = require('http').Server(app);
const timeout = require('connect-timeout');
const bodyParser = require('body-parser');
const opn = require('opn');

const log4js = require('log4js');
const config = require('./config');

log4js.configure(config.log4js);
const logger = log4js.getLogger('index');

const common = require('./routers/common');

/**
 * 异常处理
 * @param err
 * @param req
 * @param res
 * @param next
 */
function errHandler(err, req, res, next) {
  logger.error("Something went wrong: ", err);
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
 * 初始化
 */
function init() {
  return new Promise(function (resolve) {
    app.use(express.static(path.join(process.cwd(), 'public')));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(timeout(config.TIME_OUT));
    app.use(timeOutHandler);
    app.use(errHandler);

    http.listen(config.PORT);
    console.log('JMS-CI Started On Port:' + config.PORT);
    opn(`http://localhost:${config.PORT}/project.html`);

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

init().then(routers);
