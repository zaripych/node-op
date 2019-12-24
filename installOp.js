if (
  process.env.INIT_CWD === process.env.PWD ||
  process.env.INIT_CWD.indexOf(process.env.PWD) === 0
) {
  // ignore
} else {
  require('./lib/installOp');
}
