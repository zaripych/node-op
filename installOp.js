const cwd = process.cwd();
if (process.env.INIT_CWD === cwd || process.env.INIT_CWD.indexOf(cwd) === 0) {
  // ignore
} else {
  require('./lib/installOp');
}