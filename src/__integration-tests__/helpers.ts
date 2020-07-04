import {
  readFile,
  remove,
  emptyDir,
  pathExists,
  unlink,
  createReadStream,
  mkdir,
} from 'fs-extra';
import { resolve, join, normalize, relative } from 'path';
import fg from 'fast-glob';
import { createGunzip } from 'zlib';
import { extract } from 'tar-fs';
import { spawn } from 'child_process';

export const PKG_JSON = 'package.json';
export const ROOT = resolve(__dirname, '../../');

// - start of the archive file name after npm pack
const ARCH_PKG_FILE_NAME = 'node-op';

export const packageJsonVersions = async () => {
  console.log('Retrieving package json');

  const packageJsonLocation = join(ROOT, PKG_JSON);

  const packageJsonContents = await readFile(packageJsonLocation, {
    encoding: 'utf-8',
  });

  const pkg = JSON.parse(packageJsonContents) as {
    version: string;
    op_version: string;
  };

  return {
    version: pkg.version,
    opVersion: pkg.op_version,
  };
};

const checkSafety = async (dir: string) => {
  const normalized = normalize(dir);
  const relativePath = relative(ROOT, normalized);

  if (/\.\./g.test(relativePath)) {
    throw new Error(
      'We can only delete directories within the root of our package'
    );
  }

  const exists = await pathExists(normalized);
  return { exists, path: normalized };
};

export const emptyDirSafe = async (relativeToRoot: string) => {
  const { exists, path } = await checkSafety(relativeToRoot);
  if (!exists) {
    return;
  }

  await emptyDir(path);
};

export const rmDirSafe = async (relativeToRoot: string) => {
  const { exists, path } = await checkSafety(relativeToRoot);
  if (!exists) {
    return;
  }

  await remove(path);
};

export const buildAndPack = async () => {
  const { version, opVersion } = await packageJsonVersions();

  console.log('version', version);

  await spawnAndCheck('yarn', ['run', 'before-release'], {
    cwd: ROOT,
    shell: process.platform === 'win32',
  });

  await spawnAndCheck('yarn', ['run', 'build'], {
    cwd: ROOT,
    shell: process.platform === 'win32',
  });

  const packageName = `${ARCH_PKG_FILE_NAME}-${version}.tgz`;
  const packageLocation = join(ROOT, packageName);

  await unlink(packageLocation).catch(() => Promise.resolve());

  await spawnAndCheck('npm', ['pack'], {
    cwd: ROOT,
    shell: process.platform === 'win32',
  });

  return { packageName, packageLocation, version, opVersion };
};

export const unarchiveTarGz = async (tar: string, out: string) => {
  const outPath = out;
  await mkdir(outPath).catch(() => Promise.resolve());
  const gunzip = createGunzip();
  const stream = createReadStream(tar)
    .pipe(gunzip)
    .pipe(extract(outPath), { end: true });
  return new Promise((res, rej) => {
    stream.once('end', () => {
      res();
    });
    stream.once('close', () => {
      res();
    });
    stream.once('finish', () => {
      res();
    });
    stream.once('error', (err) => {
      rej(err);
    });
  });
};

const compareStrings = (a: string, b: string) => (a === b ? 0 : a > b ? 1 : -1);

const comparePathComponents = (a: string[], b: string[]): 0 | 1 | -1 => {
  if (a.length === 0 && b.length === 0) {
    return 0;
  }
  const i = compareStrings(a[0], b[0]);
  if (i === 0) {
    return comparePathComponents(a.slice(1), b.slice(1));
  } else {
    return i;
  }
};

const seps = /\\|\//g;

const comparePaths = (a: string, b: string) => {
  const componentsA = a.split(seps);
  const componentsB = b.split(seps);
  const result = comparePathComponents(componentsA, componentsB);
  return result;
};

const sortPaths = (files: string[]) => {
  files.sort(comparePaths);
};

export const sortedDirectoryContents = async (
  directory: string,
  patterns: string[] = ['**', '!node_modules/**', '!.git/**']
) => {
  const results = await fg(patterns, {
    cwd: directory,
    unique: true,
    markDirectories: true,
    onlyDirectories: false,
    onlyFiles: false,
    dot: true,
  });

  sortPaths(results);

  return results;
};

export function spawnAndCheck(
  ...args: Parameters<typeof spawn>
): Promise<string> {
  const [cmd] = args;
  const proc = spawn(...args);

  const output: string[] = [];

  if (proc.stderr as NodeJS.ReadableStream | null) {
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', (chunk: string) => {
      output.push(chunk);
    });
  }
  if (proc.stdout as NodeJS.ReadableStream | null) {
    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (chunk: string) => {
      output.push(chunk);
    });
  }

  return new Promise((res, rej) => {
    proc.once('error', (err) => {
      rej(err);
    });
    proc.once('exit', (code, signal) => {
      if (code !== 0) {
        if (typeof code === 'number') {
          rej(new Error(`process ${cmd} quit with non-zero code: ${code}`));
        } else {
          rej(
            new Error(`process ${cmd} was terminated with ${String(signal)}`)
          );
        }
      } else {
        res(output.join(''));
      }
    });
  });
}
