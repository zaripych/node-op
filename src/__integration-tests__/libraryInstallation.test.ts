import {
  ROOT,
  buildAndPack,
  sortedDirectoryContents,
  spawnAndCheck,
  unarchiveTarGz,
} from './helpers';
import { join } from 'path';
import { mkdirp, emptyDir, readJSON, writeJSON } from 'fs-extra';

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
    await mkdirp(TEST_DIR);
    await emptyDir(TEST_DIR);

    const result = await buildAndPack();
    return (pkgInfo = result);
  });

  it('should have build output in correct directory', async () => {
    const contents = await sortedDirectoryContents(join(ROOT, BUILD_DIR));
    expect(contents.filter(chunk => !chunk.startsWith('chunk-')))
      .toMatchInlineSnapshot(`
      Array [
        "binaries/",
        "binaries/op",
        "binaries/op.cmd",
        "cli.js",
        "cli.js.map",
        "forwards/",
        "forwards/add.js",
        "forwards/add.js.map",
        "forwards/confirm.js",
        "forwards/confirm.js.map",
        "forwards/create.js",
        "forwards/create.js.map",
        "forwards/delete.js",
        "forwards/delete.js.map",
        "forwards/edit.js",
        "forwards/edit.js.map",
        "forwards/encode.js",
        "forwards/encode.js.map",
        "forwards/forget.js",
        "forwards/forget.js.map",
        "forwards/get.js",
        "forwards/get.js.map",
        "forwards/list.js",
        "forwards/list.js.map",
        "forwards/reactivate.js",
        "forwards/reactivate.js.map",
        "forwards/remove.js",
        "forwards/remove.js.map",
        "forwards/signin.js",
        "forwards/signin.js.map",
        "forwards/signout.js",
        "forwards/signout.js.map",
        "forwards/suspend.js",
        "forwards/suspend.js.map",
        "forwards/update.js",
        "forwards/update.js.map",
        "installOp.js",
        "installOp.js.map",
        "interactive.js",
        "interactive.js.map",
        "vaultCheckin.js",
        "vaultCheckin.js.map",
        "vaultCheckout.js",
        "vaultCheckout.js.map",
        "vaultDiff.js",
        "vaultDiff.js.map",
      ]
    `);
  });

  it('should have packaged the right files only', async () => {
    await emptyDir(UNTAR_DIR);
    await unarchiveTarGz(pkgInfo.packageLocation, UNTAR_DIR);

    const contents = await sortedDirectoryContents(join(UNTAR_DIR, 'package'));
    expect(contents.filter(chunk => !chunk.startsWith('dist/chunk-')))
      .toMatchInlineSnapshot(`
      Array [
        "README.md",
        "cli.js",
        "dist/",
        "dist/binaries/",
        "dist/binaries/op",
        "dist/binaries/op.cmd",
        "dist/cli.js",
        "dist/cli.js.map",
        "dist/forwards/",
        "dist/forwards/add.js",
        "dist/forwards/add.js.map",
        "dist/forwards/confirm.js",
        "dist/forwards/confirm.js.map",
        "dist/forwards/create.js",
        "dist/forwards/create.js.map",
        "dist/forwards/delete.js",
        "dist/forwards/delete.js.map",
        "dist/forwards/edit.js",
        "dist/forwards/edit.js.map",
        "dist/forwards/encode.js",
        "dist/forwards/encode.js.map",
        "dist/forwards/forget.js",
        "dist/forwards/forget.js.map",
        "dist/forwards/get.js",
        "dist/forwards/get.js.map",
        "dist/forwards/list.js",
        "dist/forwards/list.js.map",
        "dist/forwards/reactivate.js",
        "dist/forwards/reactivate.js.map",
        "dist/forwards/remove.js",
        "dist/forwards/remove.js.map",
        "dist/forwards/signin.js",
        "dist/forwards/signin.js.map",
        "dist/forwards/signout.js",
        "dist/forwards/signout.js.map",
        "dist/forwards/suspend.js",
        "dist/forwards/suspend.js.map",
        "dist/forwards/update.js",
        "dist/forwards/update.js.map",
        "dist/installOp.js",
        "dist/installOp.js.map",
        "dist/interactive.js",
        "dist/interactive.js.map",
        "dist/vaultCheckin.js",
        "dist/vaultCheckin.js.map",
        "dist/vaultCheckout.js",
        "dist/vaultCheckout.js.map",
        "dist/vaultDiff.js",
        "dist/vaultDiff.js.map",
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
      await mkdirp(TEST_DIR);
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

      const pkgJson = await readJSON(join(TEST_DIR, 'package.json'));
      const modifiedPkgJson = {
        ...pkgJson,
        scripts: { ...(pkgJson.scripts || {}), op: 'op' },
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
  });
});
