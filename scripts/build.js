// @ts-check
'use strict';

const { babelBuild } = require('ts-deps');

babelBuild({
  copyAdditional: ['binaries/op', 'binaries/op.cmd'],
});
