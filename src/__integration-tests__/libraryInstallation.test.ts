import {
  ROOT,
  buildAndPack,
  sortedDirectoryContents,
  spawnAndCheck,
  unarchiveTarGz,
} from './helpers';
import { join } from 'path';
import { mkdirp, emptyDir, readJSON, writeJSON } from 'fs-extra';

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
        "binaries/",
        "binaries/op",
        "binaries/op.cmd",
        "installOp.js",
        "installOp.js.map",
        "settings.js",
        "settings.js.map",
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
        "lib/binaries/",
        "lib/binaries/op",
        "lib/binaries/op.cmd",
        "lib/installOp.js",
        "lib/installOp.js.map",
        "lib/settings.js",
        "lib/settings.js.map",
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
      });
      await spawnAndCheck('npm', ['add', 'file:' + pkgInfo.packageLocation], {
        stdio: 'inherit',
        cwd: TEST_DIR,
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
        }
      );
      expect(versionOutput.trim()).toBe(pkgInfo.opVersion);
    });
  });
});
