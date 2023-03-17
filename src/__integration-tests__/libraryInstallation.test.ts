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
  const TEST_DIR = join(ROOT, 'integration-test-installation');
  const UNTAR_DIR = join(ROOT, 'integration-test-package-untar');
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
    expect(contents.filter((chunk) => !chunk.startsWith('chunk-')))
      .toMatchInlineSnapshot(`
      Array [
        "binaries/",
        "binaries/op",
        "binaries/op.cmd",
        "cli.js",
        "forwards/",
        "forwards/add.js",
        "forwards/chunk-0c9d0175.js",
        "forwards/completion.js",
        "forwards/confirm.js",
        "forwards/create.js",
        "forwards/delete.js",
        "forwards/edit.js",
        "forwards/encode.js",
        "forwards/forget.js",
        "forwards/get.js",
        "forwards/list.js",
        "forwards/reactivate.js",
        "forwards/remove.js",
        "forwards/signin.js",
        "forwards/signout.js",
        "forwards/suspend.js",
        "forwards/update.js",
        "installOp.js",
        "interactive.js",
        "vaultCheckin.js",
        "vaultCheckout.js",
        "vaultDiff.js",
      ]
    `);
  });

  it('should have packaged the right files only', async () => {
    await emptyDir(UNTAR_DIR);
    await unarchiveTarGz(pkgInfo.packageLocation, UNTAR_DIR);

    const contents = await sortedDirectoryContents(join(UNTAR_DIR, 'package'));
    expect(contents.filter((chunk) => !chunk.startsWith('dist/chunk-')))
      .toMatchInlineSnapshot(`
      Array [
        "README.md",
        "cli.js",
        "dist/",
        "dist/binaries/",
        "dist/binaries/op",
        "dist/binaries/op.cmd",
        "dist/cli.js",
        "dist/forwards/",
        "dist/forwards/add.js",
        "dist/forwards/chunk-0c9d0175.js",
        "dist/forwards/completion.js",
        "dist/forwards/confirm.js",
        "dist/forwards/create.js",
        "dist/forwards/delete.js",
        "dist/forwards/edit.js",
        "dist/forwards/encode.js",
        "dist/forwards/forget.js",
        "dist/forwards/get.js",
        "dist/forwards/list.js",
        "dist/forwards/reactivate.js",
        "dist/forwards/remove.js",
        "dist/forwards/signin.js",
        "dist/forwards/signout.js",
        "dist/forwards/suspend.js",
        "dist/forwards/update.js",
        "dist/installOp.js",
        "dist/interactive.js",
        "dist/vaultCheckin.js",
        "dist/vaultCheckout.js",
        "dist/vaultDiff.js",
        "installOp.js",
        "interactive.js",
        "package.json",
        "vaultCheckin.js",
        "vaultCheckout.js",
        "vaultDiff.js",
      ]
    `);
  });

  describe('given empty sub-directory where we initialize a package and add ours as a dependency', () => {
    beforeAll(async () => {
      await mkdir(TEST_DIR, { recursive: true });
      await emptyDir(TEST_DIR);

      await spawnAndCheck('npm', ['init', '-y'], {
        stdio: 'inherit',
        cwd: TEST_DIR,
        shell: process.platform === 'win32',
      });
      await spawnAndCheck('npm', ['add', 'file:' + pkgInfo.packageLocation], {
        stdio: 'inherit',
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
          interactive     node-op: Lookup for passwords in interactive terminal
          vault-checkout  node-op: Download one or more files from 1-Password vault
                          to current directory
          vault-checkin   node-op: Upload one or more files to 1-Password vault from
                          current directory and trash old files with same name
          vault-diff      node-op: Compare one or more local checked-out files with
                          their original 1-Password versions
          help [command]  display help for command
        "
      `);
    });
  });
});
