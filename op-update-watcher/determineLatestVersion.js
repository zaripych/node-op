const chrome = require('selenium-webdriver/chrome');
const { Builder } = require('selenium-webdriver');
const { Query } = require('webdriver-query');
const { gt, eq, parse } = require('semver');
require('./prepareChromedriver');

const checkPage = 'https://app-updates.agilebits.com/product_history/CLI';

const versionRegex = /\d+\.\d+\.\d+(-\d+)?/;
const semVerRegex = /\d+\.\d+\.\d+/;

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {() => Promise<void>} cb
 * @returns {Promise<T>}
 */
function withFinally(promise, cb) {
  return promise
    .catch(err => cb().then(() => Promise.reject(err)))
    .then(value => cb().then(() => Promise.resolve(value)));
}

function determineLatestVersion() {
  const options = new chrome.Options()
    .detachDriver(false)
    .excludeSwitches('enable-logging')
    .addArguments('--silent')
    .headless();

  const headlessChrome = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  const query = new Query(headlessChrome);

  const versionNumber = query
    .get(checkPage)
    .then(() =>
      query
        .findElements('article > h3')
        .map(header => header.getText())
        .perform()
    )
    .then(headers => {
      const versions = headers
        .map(text => {
          const versionResult = versionRegex.exec(text);
          const semVerResult = semVerRegex.exec(text);
          return {
            version: versionResult && versionResult[0],
            semVer: semVerResult && semVerResult[0],
          };
        })
        .filter(item => item.version && item.semVer)
        .map(item => {
          const parsed = parse(item.semVer);
          return {
            semVer: parsed,
            version: item.version,
          };
        });

      versions.sort((a, b) => {
        if (eq(a.semVer, b.semVer)) {
          return 0;
        } else if (gt(a.semVer, b.semVer)) {
          return -1;
        } else {
          return 1;
        }
      });

      return Promise.resolve(versions[0]);
    });

  return withFinally(versionNumber, () => headlessChrome.quit());
}

function semVerFromOpVersion(text) {
  const semVerResult = semVerRegex.exec(text);
  return (semVerResult && semVerResult[0]) || null;
}

module.exports = {
  checkPage,
  determineLatestVersion,
  semVerFromOpVersion,
};
