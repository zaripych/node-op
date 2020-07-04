const { determineLatestVersion } = require('./determineLatestVersion.js');

determineLatestVersion()
  .then((version) => {
    console.log(version);
  })
  .catch((err) => {
    console.error('Something went wrong', err);
    process.exitCode = 1;
  });
