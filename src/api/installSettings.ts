import { arch,platform } from 'os';
import type { PeerCertificate } from 'tls';

import { homepage, op_version } from '../../package.json';

export function validateCertificate(certificate: PeerCertificate) {
  console.log('node-op: Certificate information follows', {
    subject: certificate.subject,
    subjectaltname: certificate.subjectaltname,
    fingerprint: certificate.fingerprint,
  });

  if (certificate.subject.CN === '*.cachefly.net') {
    if (!certificate.subjectaltname.includes('DNS:cache.agilebits.com')) {
      return {
        isValid: false,
        message:
          "Certificate doesn't have the cache.agilebits.com domain in it",
      };
    }
    return {
      isValid: true,
    };
  }
  return {
    isValid: false,
    message: 'Certificate is not from *.cachefly.net or *.agilebits.com.',
  };
}

export function settings() {
  const contributeUrl = homepage;
  const version = op_version;

  const config: {
    [key in NodeJS.Platform]?: {
      [key2 in 'universal' | 'x64' | 'arm']?: string;
    };
  } = {
    darwin: {
      universal: `https://cache.agilebits.com/dist/1P/op/pkg/v${version}/op_darwin_amd64_v${version}.pkg`,
    },
    linux: {
      x64: `https://cache.agilebits.com/dist/1P/op/pkg/v${version}/op_linux_386_v${version}.zip`,
      arm: `https://cache.agilebits.com/dist/1P/op/pkg/v${version}/op_linux_arm_v${version}.zip`,
    },
    win32: {
      x64: `https://cache.agilebits.com/dist/1P/op/pkg/v${version}/op_windows_amd64_v${version}.zip`,
    },
  };

  const currentPlatform = platform();
  const currentArch = arch() as 'x64' | 'arm';
  const currentConfig = config[currentPlatform];

  if (!currentConfig) {
    throw new Error(
      `Cannot find config for your platform (${currentPlatform}). Contribute: ${contributeUrl}`
    );
  }

  const url = currentConfig.universal ?? currentConfig[currentArch];

  if (!url) {
    throw new Error(
      `Cannot find config for your arch (${currentArch}). Contribute: ${contributeUrl}`
    );
  }

  if (!url.startsWith('https://cache.agilebits.com')) {
    throw new Error('Invalid URL');
  }

  return {
    contributeUrl,
    validateCertificate,
    url,
    entry: currentPlatform === 'win32' ? 'op.exe' : 'op',
    packageFileName:
      currentPlatform === 'darwin' ? 'package.pkg' : 'package.zip',
    version,
  };
}
