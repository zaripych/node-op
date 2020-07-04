// @ts-check
'use strict';

const { rollupBuild } = require('ts-deps');

rollupBuild({
  copyAdditional: ['binaries/op', 'binaries/op.cmd'],
});
