const chrome = require("selenium-webdriver/chrome");
const { Builder } = require("selenium-webdriver");
const { Query } = require("webdriver-query");
const { gt, eq, parse } = require("semver");
require("./prepareChromedriver");

const checkPage = "https://app-updates.agilebits.com/product_history/CLI";

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
    .excludeSwitches("enable-logging")
    .addArguments("--silent")
    .headless();

  const headlessChrome = new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  const query = new Query(headlessChrome);

  const versionRegex = /\d+\.\d+\.\d+(-\d+)/;

  const versionNumber = query
    .get(checkPage)
    .then(() =>
      query
        .findElements("article > h3")
        .map(header => header.getText())
        .perform()
    )
    .then(headers => {
      const versions = headers
        .map(text => {
          const result = versionRegex.exec(text);
          return result && result[0];
        })
        .filter(item => !!item)
        .map(item => parse(item));

      versions.sort((a, b) => {
        if (eq(a, b)) {
          return 0;
        } else if (gt(a, b)) {
          return -1;
        } else {
          return 1;
        }
      });

      return Promise.resolve(versions[0].version);
    });

  return withFinally(versionNumber, () => headlessChrome.quit());
}

module.exports = {
  checkPage,
  determineLatestVersion
};
