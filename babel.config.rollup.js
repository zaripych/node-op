'use strict';

const { babelConfig } = require('ts-deps');

const config = babelConfig({
  presetEnvConfig: defConf => ({
    ...defConf,
    modules: false,
  }),
});

module.exports = {
  ...config,
  presets: ['@babel/preset-react', ...config.presets],
};
