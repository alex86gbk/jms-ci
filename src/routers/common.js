const express = require('express');
const router = express.Router();

const Project = require('../components/Project');
const Server = require('../components/Server');
const Upload = require('../components/Upload');

router.post('/getProjectList', Project.getProjectList);
router.post('/saveProject', Project.saveProject);
router.post('/packageProject', Project.packageProject);
router.post('/publishProject', Project.publishProject);
router.post('/deleteProject', Project.deleteProject);
router.post('/getServerList', Server.getServerList);
router.post('/getServerSelectList', Server.getServerSelectList);
router.post('/saveServer', Server.saveServer);
router.post('/deleteServer', Server.deleteServer);
router.post('/checkServerStatus', Server.checkServerStatus);
router.post('/uploadFile', Upload.uploadFile);

module.exports = router;
