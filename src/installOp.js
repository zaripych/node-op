const https = require('https');
const fs = require('fs-extra');
const path = require('path');
const { spawnSync } = require('child_process');
const pump = require('pump');
const os = require('os');
const AdmZip = require('adm-zip');
const crypto = require('crypto');
const { promisify } = require('util');
const rimraf = require('rimraf');

const {
  url,
  packageFileName,
  entry,
  version,
  validateCertificate,
  contributeUrl,
} = require('./settings');

const mkdir = promisify(fs.mkdir);
const pipeline = (request, file) => {
  return new Promise((res, rej) => {
    pump(request, file, err => {
      if (err) {
        rej(err);
      } else {
        res();
      }
    });
  });
};
const chmod = promisify(fs.chmod);

const distDir = './dist/binaries';
const packagePath = path.join(distDir, packageFileName);
const opPath = path.join(distDir, entry);

function getOpVersion() {
  const result = spawnSync(opPath, ['--version'], { encoding: 'utf8' });
  if (result.error) {
    throw new Error(`Cannot check version of op ${result.error}`);
  }
  const output = result.stdout.trim();
  const regex = /\d+\.\d+\.\d+/g;
  const firstMatch = regex.exec(output);
  const nextMatch = regex.exec(output);
  if (!firstMatch) {
    throw new Error(`No version string found in the op output: ${output}`);
  }
  if (firstMatch && nextMatch) {
    throw new Error(
      `Found one or more version strings in op output: ${output}; Which one is correct? ${contributeUrl}`
    );
  }
  return firstMatch[0];
}

if (fs.existsSync(packagePath) && fs.existsSync(opPath)) {
  console.log(
    'node-op: The binary already downloaded and unpacked, checking version ... '
  );

  const currentVersion = getOpVersion();
  if (currentVersion === version) {
    console.log('node-op: Version matches', version);
    console.log('');
  }
}

function unpackPkgOnMacOS(pkgPath) {
  // reduce possibility we delete something on users system by generating random dir name
  const OUT_DIR = `op-pkgutil-output-${crypto.randomBytes(4).toString('hex')}`;
  const unpackDir = path.join(process.cwd(), distDir, OUT_DIR);
  try {
    rimraf.sync(unpackDir);

    const result = spawnSync('pkgutil', ['--expand', pkgPath, unpackDir], {
      encoding: 'utf8',
      env: process.env,
    });

    const logPkgUtilOutput = () => {
      console.log(
        'node-op: pkgutil output follows',
        os.EOL,
        result.output.join('')
      );
    };

    if (result.error) {
      throw new Error(`Cannot unpack .pkg file. ${result.error}`);
    }

    if (result.status !== 0) {
      logPkgUtilOutput();
      throw new Error(
        `Cannot unpack .pkg file. pkgutil quit with status ${result.status}`
      );
    }

    const tarResult = spawnSync(
      'tar',
      ['xzvf', path.join(OUT_DIR, 'Payload')],
      {
        encoding: 'utf8',
        env: process.env,
        cwd: distDir,
      }
    );

    const logTarOutput = () => {
      console.log(
        'node-op: tar output follows',
        os.EOL,
        tarResult.output.join('')
      );
    };

    if (tarResult.error) {
      throw new Error(`Cannot unpack .pkg file. ${tarResult.error}`);
    }

    if (tarResult.status !== 0) {
      logTarOutput();
      throw new Error(
        `Cannot unpack .pkg file. tar quit with status ${result.status}`
      );
    }

    if (!fs.existsSync(opPath)) {
      throw new Error(`op binary not found after extracting from .pkg`);
    }
  } finally {
    rimraf.sync(unpackDir);
  }
}

console.log('node-op: Will download the binary ... ');

const req = https.get(url, res => {
  if (res.statusCode !== 200) {
    throw new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`);
  }

  mkdir(distDir)
    .catch(() => Promise.resolve())
    .then(() => {
      const outFile = fs.createWriteStream(packagePath);
      return pipeline(res, outFile).catch(err => {
        res.destroy();
        outFile.destroy();

        throw new Error(
          `Cannot download and save the package from url '${url}' to file '${packagePath}'. ${err.message}`
        );
      });
    })
    .then(() => {
      const extension = path.extname(packagePath);
      if (extension === '.zip') {
        const zip = new AdmZip(packagePath);
        zip.extractEntryTo(entry, distDir, false, true);
        zip.extractEntryTo(entry + '.sig', distDir, false, true);
      } else if (extension === '.pkg') {
        unpackPkgOnMacOS(packagePath);
      } else {
        throw new Error(`Unexpected extension ${extension}`);
      }
    })
    .then(() => chmod(opPath, 0o755))
    .then(() => {
      const semVer = /\d+\.\d+\.\d+/.exec(version)[0];
      const currentVersion = getOpVersion();
      if (currentVersion !== semVer) {
        throw new Error(
          `The downloaded version ${currentVersion} doesn\'t match ${version}`
        );
      }
      console.log('node-op: Downloaded version', version);
    })
    .then(() => {
      console.log('');
    })
    .catch(err => {
      console.error(err);
      process.exit(-1);
    });
});

req.on('error', err => {
  console.error(err);
  process.exit(-1);
});

req.on('socket', socket => {
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
