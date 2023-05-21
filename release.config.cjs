'use strict';

module.exports = {
  branches: [
    '+([0-9])?(.{+([0-9]),x}).x',
    { name: 'master' },
    { name: 'alpha', channel: 'alpha', prerelease: 'alpha' },
    { name: 'beta', channel: 'beta', prerelease: 'beta' },
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    '@semantic-release/github',
  ],
};
