/**
 * 退出
 */
function exit(req, res) {
  res.send({
    result: {
      status: 1,
      errMsg: '',
    },
  });
  process.exit();
}

module.exports = {
  exit,
};
