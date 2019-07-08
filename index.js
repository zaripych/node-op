const os = require("os");
const pack = require("./package.json");

function validateCertificate(certificate) {
  console.log("node-op: Certificate information follows", {
    subject: certificate.subject,
    subjectaltname: certificate.subjectaltname,
    fingerprint: certificate.fingerprint
  });

  if (certificate.subject.CN === "*.cachefly.net") {
    if (certificate.subjectaltname.indexOf("DNS:cache.agilebits.com") === -1) {
      return {
        isValid: false,
        message: "Certificate doesn't have the cache.agilebits.com domain in it"
      };
    }
    return {
      isValid: true
    };
  }
  return {
    isValid: false,
    message: "Certificate is not from *.cachefly.net or *.agilebits.com."
  };
}

const contributeUrl = pack.homepage;
const version = pack.op_version;

const config = {
  darwin: {
    universal: `https://cache.agilebits.com/dist/1P/op/pkg/v${version}/op_darwin_amd64_v${version}.zip`
  },
  linux: {
    x64: `https://cache.agilebits.com/dist/1P/op/pkg/v${version}/op_linux_386_v${version}.zip`,
    arm: `https://cache.agilebits.com/dist/1P/op/pkg/v${version}/op_linux_arm_v${version}.zip`
  },
  win32: {
    x64: `https://cache.agilebits.com/dist/1P/op/pkg/v${version}/op_windows_amd64_v${version}.zip`
  }
};

const platform = os.platform();
const arch = os.arch();
const currentConfig = config[platform];

if (!currentConfig) {
  throw new Error(
    `Cannot find config for your platform (${platform}). Contribute: ${contributeUrl}`
  );
}

/**
 * @type {string}
 */
const url =
  "universal" in currentConfig ? currentConfig.universal : currentConfig[arch];

if (!url) {
  throw new Error(
    `Cannot find config for your arch (${arch}). Contribute: ${contributeUrl}`
  );
}

if (!url.startsWith("https://cache.agilebits.com")) {
  throw new Error("Invalid URL");
}

module.exports = {
  contributeUrl,
  validateCertificate,
  url,
  entry: platform === "win32" ? "op.exe" : "op",
  version
};
