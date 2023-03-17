import AdmZip from 'adm-zip';
import { spawnSync } from 'child_process';
import { randomBytes } from 'crypto';
import { createWriteStream, existsSync, rmdirSync } from 'fs';
import { chmod,mkdir } from 'fs/promises';
import { get } from 'https';
import { EOL } from 'os';
import { extname,join } from 'path';
import pump from 'pump';

import { settings,validateCertificate } from './installSettings';

type TLSSocket = import('tls').TLSSocket;
type IncomingMessage = import('http').IncomingMessage;

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

const distDir = './dist/binaries';
const packagePath = join(distDir, packageFileName);
const opPath = join(distDir, entry);

function getOpVersion() {
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

export async function installOnePassword() {
  if (existsSync(packagePath) && existsSync(opPath)) {
    console.log(
      'node-op: The binary already downloaded and unpacked, checking version ... '
    );

    const currentVersion = getOpVersion();
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
          req.abort();
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
          req.abort();
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
    unpackPkgOnMacOS(packagePath);
  } else {
    throw new Error(`Unexpected extension ${extension}`);
  }

  await chmod(opPath, 0o755);

  const semVer = /\d+\.\d+\.\d+/.exec(version);
  if (!semVer) {
    throw new Error('Version is not valid');
  }
  const requestedVersion = semVer[0];

  const downloadedVersion = getOpVersion();
  if (downloadedVersion !== requestedVersion) {
    throw new Error(
      `The downloaded version ${downloadedVersion} doesn't match ${version}`
    );
  }

  console.log('node-op: Downloaded version', version);
  console.log('');
}

function unpackPkgOnMacOS(pkgPath: string) {
  // reduce possibility we delete something on users system by generating random dir name
  const OUT_DIR = `op-pkgutil-output-${randomBytes(4).toString('hex')}`;
  const unpackDir = join(process.cwd(), distDir, OUT_DIR);
  try {
    rmdirSync(unpackDir, { recursive: true });

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

    const tarResult = spawnSync('tar', ['xzvf', join(OUT_DIR, 'Payload')], {
      encoding: 'utf8',
      env: process.env,
      cwd: distDir,
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

    if (!existsSync(opPath)) {
      throw new Error(`op binary not found after extracting from .pkg`);
    }
  } finally {
    rmdirSync(unpackDir, { recursive: true });
  }
}
