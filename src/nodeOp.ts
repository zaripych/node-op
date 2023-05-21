import chalk from 'chalk';
import commander from 'commander';
import { join } from 'path';
import { fileURLToPath } from 'url';

import type { Command } from './api';

const forwarded: Command[] = [
  {
    command: 'add',
    description: 'Add access for users or groups to groups or vaults.',
  },
  { command: 'confirm', description: 'Confirm a user.' },
  { command: 'create', description: 'Create an object.' },
  { command: 'delete', description: 'Remove an object.' },
  { command: 'edit', description: 'Edit an object.' },
  {
    command: 'encode',
    description: 'Encode the JSON needed to create an item.',
  },
  {
    command: 'forget',
    description: 'Remove a 1Password account from this device.',
  },
  { command: 'get', description: 'Get details about an object.' },
  { command: 'list', description: 'List objects and events.' },
  { command: 'reactivate', description: 'Reactivate a suspended user.' },
  {
    command: 'remove',
    description: 'Revoke access for users or groups to groups or vaults.',
  },
  { command: 'signin', description: 'Sign in to your 1Password account.' },
  { command: 'signout', description: 'Sign out of your 1Password account.' },
  { command: 'suspend', description: 'Suspend a user.' },
  { command: 'update', description: 'Check for updates.' },
];

function run() {
  const dirname = fileURLToPath(new URL('.', import.meta.url));
  const program = new commander.Command();

  const next = forwarded.reduce(
    (prog, comm) =>
      prog.command(comm.command, comm.description, {
        executableFile: ['./dist/forwards/', comm.command, '.js'].join(''),
      }),
    program
  );

  const extension = dirname.endsWith('src/') ? '.ts' : '.js';

  next
    .command(
      'interactive',
      chalk.gray('node-op:') + ' Lookup for passwords in interactive terminal.',
      {
        isDefault: true,
        executableFile: join(dirname, './interactive' + extension),
      }
    )
    .command(
      'vault-checkout',
      chalk.gray('node-op:') +
        ' Download one or more files from 1-Password vault to current directory.',
      {
        executableFile: join(dirname, './vault-checkout' + extension),
      }
    )
    .command(
      'vault-checkin',
      chalk.gray('node-op:') +
        ' Upload one or more files to 1-Password vault from current directory and trash old files with same name.',
      {
        executableFile: join(dirname, './vault-checkin' + extension),
      }
    )
    .command(
      'vault-diff',
      chalk.gray('node-op:') +
        ' Compare one or more local checked-out files with their original 1-Password versions.',
      {
        executableFile: join(dirname, './vault-diff' + extension),
      }
    )
    .parse(process.argv);
}

run();
