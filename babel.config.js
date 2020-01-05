'use strict';

const { babelConfig } = require('ts-deps');

const config = babelConfig();

module.exports = {
  ...config,
  presets: ['@babel/preset-react', ...config.presets],
};
