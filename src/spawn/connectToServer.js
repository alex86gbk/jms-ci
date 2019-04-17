const node_ssh = require('node-ssh');
const ssh = new node_ssh();

process.stdin.on('data', (chunk) => {
  const connect = JSON.parse(chunk.toString());
  connect.readyTimeout = 5000;
  ssh.connect(connect).then(function () {
    process.stdout.write(JSON.stringify({
      status: 1,
      errMsg: '',
    }), 'utf8');
    setTimeout(function () {
      process.exit();
    }, 2000);
  }).catch(function (err) {
    process.stdout.write(JSON.stringify({
      status: 0,
      errMsg: err.message,
    }), 'utf8');
    setTimeout(function () {
      process.exit();
    }, 2000);
  });
});
