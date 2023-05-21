import AdmZip from 'adm-zip';
import { spawnSync } from 'child_process';
import { randomBytes } from 'crypto';
import { createWriteStream, existsSync, rmSync } from 'fs';
import { chmod, mkdir } from 'fs/promises';
import type { IncomingMessage } from 'http';
import { get } from 'https';
import { EOL } from 'os';
import { extname, join } from 'path';
import pump from 'pump';
import type { TLSSocket } from 'tls';
import { fileURLToPath } from 'url';

import { settings, validateCertificate } from './installSettings';

const pipeline = (
  source: NodeJS.ReadableStream,
  target: NodeJS.WritableStream
) => {
  return new Promise<void>((res, rej) => {
    pump(source, target, (err: Error | undefined) => {
      if (err) {
        rej(err);
      } else {
        res();
      }
    });
  });
};

const { packageFileName, entry, contributeUrl, version, url } = settings();

function getOpVersion(opPath: string) {
  const result = spawnSync(opPath, ['--version'], { encoding: 'utf8' });
  if (result.error) {
    throw new Error(`Cannot check version of op ${String(result.error)}`);
  }
  const output = result.stdout.trim();
  const regex = /\d+\.\d+\.\d+/g;
  const firstMatch = regex.exec(output);
  const nextMatch = regex.exec(output);
  if (!firstMatch) {
    throw new Error(`No version string found in the op output: ${output}`);
  }
  if (nextMatch) {
    throw new Error(
      `Found one or more version strings in op output: ${output}; Which one is correct? ${contributeUrl}`
    );
  }
  return firstMatch[0];
}

export async function installOnePassword(directory?: string) {
  const distDir =
    directory || fileURLToPath(new URL('../bin', import.meta.url));
  const packagePath = join(distDir, packageFileName);
  const opPath = join(distDir, entry);

  if (existsSync(packagePath) && existsSync(opPath)) {
    console.log(
      'node-op: The binary already downloaded and unpacked, checking version ... '
    );

    const currentVersion = getOpVersion(opPath);
    if (currentVersion === version) {
      console.log('node-op: Version matches', version);
      console.log('');
    }
    return;
  }

  console.log('node-op: Will download the binary ... ');

  const res = await new Promise<IncomingMessage>((resolve, reject) => {
    const req = get(url, (incoming) => {
      if (incoming.statusCode !== 200) {
        throw new Error(
          `HTTP ${String(incoming.statusCode)}: ${String(
            incoming.statusMessage
          )}`
        );
      }

      resolve(incoming);
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('socket', (socket: TLSSocket) => {
      socket.on('secureConnect', () => {
        if (!socket.authorized) {
          req.emit('error', new Error('Unauthorized'));
          req.destroy();
          return;
        }

        const certificate = socket.getPeerCertificate();

        const result = validateCertificate(certificate);

        if (!result.isValid) {
          req.emit(
            'error',
            new Error(
              [
                'Certificate is not valid.',
                result.message,
                `Contribute by updating validation logic for it: ${contributeUrl}`,
              ]
                .filter(Boolean)
                .join(' ')
            )
          );
          req.destroy();
          return;
        }
      });
    });

    req.end();
  });

  await mkdir(distDir).catch(() => Promise.resolve());

  const outFile = createWriteStream(packagePath);

  await pipeline(res, outFile).catch((err: Error) => {
    res.destroy();
    outFile.destroy();

    throw new Error(
      `Cannot download and save the package from url '${url}' to file '${packagePath}'. ${err.message}`
    );
  });

  const extension = extname(packagePath);
  if (extension === '.zip') {
    const zip = new AdmZip(packagePath);
    zip.extractEntryTo(entry, distDir, false, true);
    zip.extractEntryTo(entry + '.sig', distDir, false, true);
  } else if (extension === '.pkg') {
    // reduce possibility we delete something on users system by generating random dir name
    const OUT_DIR = `op-pkgutil-output-${randomBytes(4).toString('hex')}`;
    const unpackDir = join(distDir, OUT_DIR);
    unpackPkgOnMacOS(packagePath, unpackDir);

    if (!existsSync(opPath)) {
      throw new Error(`op binary not found after extracting from .pkg`);
    }
  } else {
    throw new Error(`Unexpected extension ${extension}`);
  }

  await chmod(opPath, 0o755);

  const semVer = /\d+\.\d+\.\d+/.exec(version);
  if (!semVer) {
    throw new Error('Version is not valid');
  }
  const requestedVersion = semVer[0];

  const downloadedVersion = getOpVersion(opPath);
  if (downloadedVersion !== requestedVersion) {
    throw new Error(
      `The downloaded version ${String(
        downloadedVersion
      )} doesn't match ${version}`
    );
  }

  console.log('node-op: Downloaded version', version);
  console.log('');
}

function unpackPkgOnMacOS(pkgPath: string, unpackDir: string) {
  try {
    try {
      rmSync(unpackDir, { recursive: true });
    } catch (err) {
      // ignore
    }

    const result = spawnSync('pkgutil', ['--expand', pkgPath, unpackDir], {
      encoding: 'utf8',
      env: process.env,
    });

    const logPkgUtilOutput = () => {
      console.log(
        'node-op: pkgutil output follows',
        EOL,
        result.output.join('')
      );
    };

    if (result.error) {
      throw new Error(`Cannot unpack .pkg file. ${String(result.error)}`);
    }

    if (result.status !== 0) {
      logPkgUtilOutput();
      throw new Error(
        `Cannot unpack .pkg file. pkgutil quit with status ${String(
          result.status
        )}`
      );
    }

    const tarResult = spawnSync('tar', ['xzvf', join(unpackDir, 'Payload')], {
      encoding: 'utf8',
      env: process.env,
      cwd: join(unpackDir, '../'),
    });

    const logTarOutput = () => {
      console.log(
        'node-op: tar output follows',
        EOL,
        tarResult.output.join('')
      );
    };

    if (tarResult.error) {
      throw new Error(`Cannot unpack .pkg file. ${String(tarResult.error)}`);
    }

    if (tarResult.status !== 0) {
      logTarOutput();
      throw new Error(
        `Cannot unpack .pkg file. tar quit with status ${result.status}`
      );
    }
  } finally {
    try {
      rmSync(unpackDir, { recursive: true });
    } catch (err) {
      // ignore
    }
  }
}
