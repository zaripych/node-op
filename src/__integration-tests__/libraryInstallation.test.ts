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
    const contents = await sortedDirectoryContents(join(ROOT, './lib'));
    expect(contents).toMatchInlineSnapshot(`
      Array [
        "api/",
        "api/aggregateError.js",
        "api/aggregateError.js.map",
        "api/catchAsync.js",
        "api/catchAsync.js.map",
        "api/createDocument.js",
        "api/createDocument.js.map",
        "api/deleteItem.js",
        "api/deleteItem.js.map",
        "api/ensureError.js",
        "api/ensureError.js.map",
        "api/getDocument.js",
        "api/getDocument.js.map",
        "api/index.js",
        "api/index.js.map",
        "api/item.js",
        "api/item.js.map",
        "api/listDocuments.js",
        "api/listDocuments.js.map",
        "api/listItems.js",
        "api/listItems.js.map",
        "api/rethrowAsync.js",
        "api/rethrowAsync.js.map",
        "api/spawn.js",
        "api/spawn.js.map",
        "api/types.js",
        "api/types.js.map",
        "binaries/",
        "binaries/op",
        "binaries/op.cmd",
        "commands/",
        "commands/vaultCheckin.js",
        "commands/vaultCheckin.js.map",
        "commands/vaultCheckout.js",
        "commands/vaultCheckout.js.map",
        "installOp.js",
        "installOp.js.map",
        "settings.js",
        "settings.js.map",
        "vaultCheckin.js",
        "vaultCheckin.js.map",
        "vaultCheckout.js",
        "vaultCheckout.js.map",
      ]
    `);
  });

  it('should have packaged the right files only', async () => {
    await emptyDir(UNTAR_DIR);
    await unarchiveTarGz(pkgInfo.packageLocation, UNTAR_DIR);

    const contents = await sortedDirectoryContents(join(UNTAR_DIR, 'package'));
    expect(contents).toMatchInlineSnapshot(`
      Array [
        "README.md",
        "installOp.js",
        "lib/",
        "lib/api/",
        "lib/api/aggregateError.js",
        "lib/api/aggregateError.js.map",
        "lib/api/catchAsync.js",
        "lib/api/catchAsync.js.map",
        "lib/api/createDocument.js",
        "lib/api/createDocument.js.map",
        "lib/api/deleteItem.js",
        "lib/api/deleteItem.js.map",
        "lib/api/ensureError.js",
        "lib/api/ensureError.js.map",
        "lib/api/getDocument.js",
        "lib/api/getDocument.js.map",
        "lib/api/index.js",
        "lib/api/index.js.map",
        "lib/api/item.js",
        "lib/api/item.js.map",
        "lib/api/listDocuments.js",
        "lib/api/listDocuments.js.map",
        "lib/api/listItems.js",
        "lib/api/listItems.js.map",
        "lib/api/rethrowAsync.js",
        "lib/api/rethrowAsync.js.map",
        "lib/api/spawn.js",
        "lib/api/spawn.js.map",
        "lib/api/types.js",
        "lib/api/types.js.map",
        "lib/binaries/",
        "lib/binaries/op",
        "lib/binaries/op.cmd",
        "lib/commands/",
        "lib/commands/vaultCheckin.js",
        "lib/commands/vaultCheckin.js.map",
        "lib/commands/vaultCheckout.js",
        "lib/commands/vaultCheckout.js.map",
        "lib/installOp.js",
        "lib/installOp.js.map",
        "lib/settings.js",
        "lib/settings.js.map",
        "lib/vaultCheckin.js",
        "lib/vaultCheckin.js.map",
        "lib/vaultCheckout.js",
        "lib/vaultCheckout.js.map",
        "package.json",
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
