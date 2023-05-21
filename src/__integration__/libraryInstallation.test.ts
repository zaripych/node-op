import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { mkdir } from 'fs/promises';
import { join } from 'path';

import { emptyDir, readJSON, writeJSON } from './helpers';
import {
  buildAndPack,
  ROOT,
  sortedDirectoryContents,
  spawnAndCheck,
  unarchiveTarGz,
} from './helpers';

jest.setTimeout(60000);

describe('given built and packaged library', () => {
  const TEST_DIR = join(ROOT, 'node_modules', '.integration-test-installation');
  const UNTAR_DIR = join(
    ROOT,
    'node_modules',
    '.integration-test-package-untar'
  );
  const BUILD_DIR = './dist';

  let pkgInfo: {
    packageName: string;
    packageLocation: string;
    version: string;
    opVersion: string;
  };

  beforeAll(async () => {
    await mkdir(TEST_DIR, { recursive: true });
    await emptyDir(TEST_DIR);

    const result = await buildAndPack();

    return (pkgInfo = result);
  });

  it('should have build output in correct directory', async () => {
    const contents = await sortedDirectoryContents(join(ROOT, BUILD_DIR));
    expect(contents.filter((chunk) => !chunk.includes('chunk.')))
      .toMatchInlineSnapshot(`
      [
        "README.md",
        "bin/node-op.gen.mjs",
        "bin/op",
        "bin/op.cmd",
        "bin/vault-checkin.gen.mjs",
        "bin/vault-checkout.gen.mjs",
        "bin/vault-diff.gen.mjs",
        "bin/",
        "dist/installOp.js",
        "dist/interactive.js",
        "dist/main.js",
        "dist/node-op.js",
        "dist/vault-checkin.js",
        "dist/vault-checkout.js",
        "dist/vault-diff.js",
        "dist/",
        "forwards/add.js",
        "forwards/completion.js",
        "forwards/confirm.js",
        "forwards/create.js",
        "forwards/delete.js",
        "forwards/edit.js",
        "forwards/encode.js",
        "forwards/forget.js",
        "forwards/get.js",
        "forwards/helper.js",
        "forwards/list.js",
        "forwards/reactivate.js",
        "forwards/remove.js",
        "forwards/signin.js",
        "forwards/signout.js",
        "forwards/suspend.js",
        "forwards/update.js",
        "forwards/",
        "package.json",
      ]
    `);
  });

  it('should have packaged the right files only', async () => {
    await emptyDir(UNTAR_DIR);
    await unarchiveTarGz(pkgInfo.packageLocation, UNTAR_DIR);

    const contents = await sortedDirectoryContents(join(UNTAR_DIR, 'package'));
    expect(contents.filter((chunk) => !chunk.includes('chunk.')))
      .toMatchInlineSnapshot(`
      [
        "README.md",
        "bin/node-op.gen.mjs",
        "bin/op",
        "bin/op.cmd",
        "bin/vault-checkin.gen.mjs",
        "bin/vault-checkout.gen.mjs",
        "bin/vault-diff.gen.mjs",
        "bin/",
        "dist/installOp.js",
        "dist/interactive.js",
        "dist/main.js",
        "dist/node-op.js",
        "dist/vault-checkin.js",
        "dist/vault-checkout.js",
        "dist/vault-diff.js",
        "dist/",
        "forwards/add.js",
        "forwards/completion.js",
        "forwards/confirm.js",
        "forwards/create.js",
        "forwards/delete.js",
        "forwards/edit.js",
        "forwards/encode.js",
        "forwards/forget.js",
        "forwards/get.js",
        "forwards/helper.js",
        "forwards/list.js",
        "forwards/reactivate.js",
        "forwards/remove.js",
        "forwards/signin.js",
        "forwards/signout.js",
        "forwards/suspend.js",
        "forwards/update.js",
        "forwards/",
        "package.json",
      ]
    `);
  });

  describe('given empty sub-directory where we initialize a package and add ours as a dependency', () => {
    beforeAll(async () => {
      await spawnAndCheck('npm', ['init', '-y'], {
        stdio: 'pipe',
        cwd: TEST_DIR,
        shell: process.platform === 'win32',
      });
      await spawnAndCheck('npm', ['add', 'file:' + pkgInfo.packageLocation], {
        stdio: 'pipe',
        cwd: TEST_DIR,
        shell: process.platform === 'win32',
      });

      const pkgJson = await readJSON<{ scripts?: Record<string, string> }>(
        join(TEST_DIR, 'package.json')
      );
      const modifiedPkgJson = {
        ...pkgJson,
        scripts: { ...(pkgJson.scripts || {}), op: 'op', 'node-op': 'node-op' },
      };
      await writeJSON(join(TEST_DIR, 'package.json'), modifiedPkgJson, {
        spaces: '  ',
      });
    });

    it('should install op of pinned version', async () => {
      const versionOutput = await spawnAndCheck(
        'npm',
        ['run', '-s', 'op', '--', '--version'],
        {
          cwd: TEST_DIR,
          shell: process.platform === 'win32',
        }
      );
      expect(versionOutput.trim()).toBe(pkgInfo.opVersion);
    });

    it('should print help', async () => {
      const output = await spawnAndCheck(
        'npm',
        ['run', '-s', 'node-op', '--', '--help'],
        {
          cwd: TEST_DIR,
          env: {
            ...process.env,
            FORCE_COLOR: String(0),
          },
          shell: process.platform === 'win32',
        }
      );
      expect(output).toMatchInlineSnapshot(`
        "Usage: node-op [options] [command]

        Options:
          -h, --help      display help for command

        Commands:
          add             Add access for users or groups to groups or vaults.
          confirm         Confirm a user.
          create          Create an object.
          delete          Remove an object.
          edit            Edit an object.
          encode          Encode the JSON needed to create an item.
          forget          Remove a 1Password account from this device.
          get             Get details about an object.
          list            List objects and events.
          reactivate      Reactivate a suspended user.
          remove          Revoke access for users or groups to groups or vaults.
          signin          Sign in to your 1Password account.
          signout         Sign out of your 1Password account.
          suspend         Suspend a user.
          update          Check for updates.
          interactive     node-op: Lookup for passwords in interactive terminal.
          vault-checkout  node-op: Download one or more files from 1-Password vault
                          to current directory.
          vault-checkin   node-op: Upload one or more files to 1-Password vault from
                          current directory and trash old files with same name.
          vault-diff      node-op: Compare one or more local checked-out files with
                          their original 1-Password versions.
          help [command]  display help for command
        "
      `);
    });
  });
});
