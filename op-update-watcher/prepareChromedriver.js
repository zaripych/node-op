const path = require('path');

const chromedriverPath = path.join(
  path.dirname(require.resolve('chromedriver')),
  'chromedriver'
);

process.env.PATH = [chromedriverPath, process.env.PATH].join(path.delimiter);
