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
    expect(contents.filter(chunk => !chunk.startsWith('chunk-')))
      .toMatchInlineSnapshot(`
      Array [
        "README.md",
        "dist/",
        "dist/binaries/",
        "dist/binaries/op",
        "dist/binaries/op.cmd",
        "dist/chunk-06815002.js",
        "dist/chunk-06815002.js.map",
        "dist/chunk-6f284617.js",
        "dist/chunk-6f284617.js.map",
        "dist/chunk-753be599.js",
        "dist/chunk-753be599.js.map",
        "dist/chunk-b062adee.js",
        "dist/chunk-b062adee.js.map",
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
