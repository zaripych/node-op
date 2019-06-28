const { spawnSync } = require("child_process");
const { writeFileSync, readFileSync, existsSync } = require("fs");
const path = require("path");
const os = require("os");
const { gt, gte } = require("semver");
const octokit = require("@octokit/rest");
const {
  determineLatestVersion,
  semVerFromOpVersion,
  checkPage
} = require("./determineLatestVersion");
const rimraf = require("rimraf");

const pack = require("../package.json");
const packageOpVersion = pack["op_version"];

const rootDir = path.join(__dirname, "../");
const cloneDirName = "node-op-temp";
const cloneDir = path.join(rootDir, "node-op-temp");

const gitUrl = repoCreds =>
  `https://${repoCreds ? repoCreds + "@" : ""}github.com/zaripych/node-op.git`;

const url = gitUrl(process.env.GH_TOKEN);
const branch = "master";
const pushBranch = "fix/upgrade-op-version";

function updatePackageJsonIfRequired(version) {
  const packageJsonPath = path.join(cloneDir, "package.json");

  const contents = readFileSync(packageJsonPath, { encoding: "utf8" });

  const packageJson = JSON.parse(contents);

  const oldVersion = semVerFromOpVersion(packageJson["op_version"]);

  if (gte(oldVersion, version)) {
    console.log(
      "The version in the checked out code is already higher or equal",
      oldVersion
    );
    return false;
  }

  packageJson["op_version"] = version;

  writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, undefined, "  ") + os.EOL,
    { encoding: "utf8" }
  );

  return true;
}

/**
 *
 * @param {string} command
 * @param {Array<string>} args
 * @param {import('child_process').SpawnSyncOptionsWithStringEncoding} options
 */
function spawn(command, args, options) {
  console.log(`${command} ${args.join(" ")}`);

  const child = spawnSync(command, args, {
    encoding: "utf8",
    cwd: cloneDir, // <-- most of the commands below work in this directory, except gitClone
    env: process.env,
    ...options
  });

  if (child.output) {
    console.log(child.output.filter(item => typeof item === "string").join(""));
  }

  if (child.error) {
    throw child.error;
  }

  console.log();

  return child;
}

/**
 *
 * @param {string} command
 * @param {Array<string>} args
 * @param {import('child_process').SpawnSyncOptionsWithStringEncoding} options
 */
function spawnOutput(command, args, options) {
  const result = spawn(command, args, options);

  if (result.status !== 0) {
    throw new Error(
      `The exit status of the last command is not zero: ${result.status}`
    );
  }

  return result.stdout;
}

/**
 *
 * @param {string} command
 * @param {Array<string>} args
 * @param {import('child_process').SpawnSyncOptionsWithStringEncoding} options
 */
function spawnStatus(command, args, options) {
  return spawn(command, args, options).status;
}

function gitClone() {
  if (existsSync(cloneDir)) {
    console.log("Deleting", cloneDir);
    rimraf.sync(cloneDir);
  }
  spawnOutput("git", ["clone", "-b", branch, url, cloneDirName], {
    cwd: rootDir
  });
}

function gitBranchExists(b) {
  const status = spawnStatus("git", ["show-branch", `origin/${b}`]);
  return status === 0;
}

function gitCheckout() {
  const branchExists = gitBranchExists(pushBranch);
  if (branchExists) {
    spawnOutput("git", ["checkout", pushBranch]);
  } else {
    spawnOutput("git", ["checkout", "-b", pushBranch]);
  }
}

function gitAdd() {
  spawnOutput("git", ["add", "package.json"]);
}

function gitStatus() {
  return spawnOutput("git", ["status"]);
}

function gitCommit() {
  spawnOutput("git", ["commit", "-m", "fix: upgrade op cli version"]);
}

function gitPush() {
  spawnOutput("git", ["push", url, `HEAD:${pushBranch}`]);
}

determineLatestVersion()
  .then(version => {
    if (!gt(version.semVer, semVerFromOpVersion(packageOpVersion))) {
      console.log("No updates");
      return;
    }

    gitClone();

    gitCheckout();

    if (!updatePackageJsonIfRequired(version.semVer)) {
      return;
    }

    gitAdd();

    if (/nothing to commit, working tree clean/.test(gitStatus())) {
      return;
    }

    gitCommit();

    gitPush();

    const kit = new octokit();
    kit.authenticate({
      type: "oauth",
      token: process.env.GH_TOKEN
    });

    return kit.pulls
      .list({
        owner: "zaripych",
        repo: "node-op",
        state: "open",
        base: "master",
        head: "fix/upgrade-op-version"
      })
      .then(pulls => {
        if (pulls.data.length !== 0) {
          console.log("Pull request already open");
          return;
        }

        return kit.pulls
          .create({
            owner: "zaripych",
            repo: "node-op",
            base: "master",
            head: "fix/upgrade-op-version",
            title: "fix/upgrade-op-version",
            body: `Hi there @zaripych, according to ${checkPage}, it seems there is new version of \`op\` CLI available, please merge this pull request to make it available to users`
          })
          .then(result =>
            kit.pulls.createReviewRequest({
              owner: "zaripych",
              repo: "node-op",
              number: result.data.number,
              reviewers: ["zaripych"]
            })
          );
      });
  })
  .catch(err => {
    console.error("Error happened", err);
    process.exit(-1);
  });
