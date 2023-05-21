import { Octokit } from '@octokit/rest';
import type { SpawnSyncOptions } from 'child_process';
import { spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { EOL } from 'os';
import { join } from 'path';
import { sync } from 'rimraf';
import { gt, gte } from 'semver';
import { fileURLToPath, URL } from 'url';

import pack from '../../package.json';
import {
  checkPage,
  determineLatestVersion,
  semVerFromOpVersion,
} from './determineLatestVersion';

const packageOpVersion = pack['op_version'];

const rootDir = fileURLToPath(new URL('../', import.meta.url));
const cloneDirName = 'node-op-temp';
const cloneDir = join(rootDir, 'node-op-temp');

const gitUrl = (repoCreds: string | undefined) =>
  `https://${repoCreds ? repoCreds + '@' : ''}github.com/zaripych/node-op.git`;

const url = gitUrl(process.env['GH_TOKEN']);
const branch = 'master';
const pushBranch = 'fix/upgrade-op-version';

function updatePackageJsonIfRequired(version) {
  if (typeof version !== 'string') {
    throw new Error('Expected semver version string');
  }
  const packageJsonPath = join(cloneDir, 'package.json');

  const contents = readFileSync(packageJsonPath, { encoding: 'utf8' });

  const packageJson = JSON.parse(contents) as {
    op_version?: string;
  };

  const packageJsonOpVersion = packageJson['op_version'];

  if (typeof packageJsonOpVersion !== 'string') {
    throw new Error('Expected semver version string in the package json');
  }

  const oldVersion = semVerFromOpVersion(packageJsonOpVersion);

  if (oldVersion && gte(oldVersion, version)) {
    console.log(
      'The version in the checked out code is already higher or equal',
      oldVersion
    );
    return false;
  }

  packageJson['op_version'] = version;

  writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, undefined, '  ') + EOL,
    { encoding: 'utf8' }
  );

  return true;
}

function spawn(command: string, args: string[], options?: SpawnSyncOptions) {
  console.log(`${command} ${args.join(' ')}`);

  const child = spawnSync(command, args, {
    cwd: cloneDir, // <-- most of the commands below work in this directory, except gitClone
    env: process.env,
    ...options,
    encoding: 'utf8',
  });

  console.log(child.output.filter((item) => typeof item === 'string').join(''));

  if (child.error) {
    throw child.error;
  }

  console.log();

  return child;
}

function spawnOutput(
  command: string,
  args: string[],
  options?: SpawnSyncOptions
) {
  const result = spawn(command, args, options);

  if (result.status !== 0) {
    throw new Error(
      `The exit status of the last command is not zero: ${String(
        result.status
      )}`
    );
  }

  return result.stdout;
}

function spawnStatus(
  command: string,
  args: string[],
  options?: SpawnSyncOptions
) {
  return spawn(command, args, options).status;
}

function gitClone() {
  if (existsSync(cloneDir)) {
    console.log('Deleting', cloneDir);
    sync(cloneDir);
  }
  spawnOutput('git', ['clone', '-b', branch, url, cloneDirName], {
    cwd: rootDir,
  });
}

function gitBranchExists(b: string) {
  const status = spawnStatus('git', ['show-branch', `origin/${b}`]);
  return status === 0;
}

function gitCheckout() {
  const branchExists = gitBranchExists(pushBranch);
  if (branchExists) {
    spawnOutput('git', ['checkout', pushBranch]);
  } else {
    spawnOutput('git', ['checkout', '-b', pushBranch]);
  }
}

function gitAdd() {
  spawnOutput('git', ['add', 'package.json']);
}

function gitStatus() {
  return spawnOutput('git', ['status']);
}

function gitCommit() {
  spawnOutput('git', ['commit', '-m', 'fix: upgrade op cli version']);
}

function gitPush() {
  spawnOutput('git', ['push', url, `HEAD:${pushBranch}`]);
}

determineLatestVersion()
  .then((version) => {
    const currentVersion = semVerFromOpVersion(packageOpVersion);
    if (!currentVersion) {
      throw new Error('Current version is unknown');
    }
    if (!gt(version.semVer, currentVersion)) {
      console.log('No updates');
      return;
    }

    gitClone();

    gitCheckout();

    if (!updatePackageJsonIfRequired(version.semVer.version)) {
      return;
    }

    gitAdd();

    if (/nothing to commit, working tree clean/.test(gitStatus())) {
      return;
    }

    gitCommit();

    gitPush();

    const kit = new Octokit({
      auth: process.env.GH_TOKEN,
    });

    return kit.pulls
      .list({
        owner: 'zaripych',
        repo: 'node-op',
        state: 'open',
        base: 'master',
        head: 'zaripych:fix/upgrade-op-version',
      })
      .then((pulls) => {
        if (pulls.data.length !== 0) {
          console.log('Pull request already open');
          return;
        }

        return kit.pulls
          .create({
            owner: 'zaripych',
            repo: 'node-op',
            base: 'master',
            head: 'fix/upgrade-op-version',
            title: 'fix/upgrade-op-version',
            body: `Hi there @zaripych, according to ${checkPage}, it seems there is new version of \`op\` CLI available, please merge this pull request to make it available to users`,
          })
          .then((result) =>
            kit.pulls.requestReviewers({
              owner: 'zaripych',
              repo: 'node-op',
              pull_number: result.data.number,
              reviewers: ['zaripych'],
            })
          );
      });
  })
  .catch((err) => {
    console.error('Error happened', err);
    process.exitCode = 1;
  });
