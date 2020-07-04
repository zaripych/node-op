'use strict';

const { eslintConfig } = require('ts-deps');

module.exports = eslintConfig({
  src: {
    rules: {
      // no much sense for a non-library
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
});
