const os = require("os");
const pack = require("./package.json");

const fingerprints = [
  "11:83:B0:F0:F1:BD:77:DA:99:CE:E4:7B:0E:E2:5F:C9:5B:A7:93:01",
  "EF:0A:E0:7A:95:07:93:BA:44:3A:79:C4:89:BF:D0:5A:65:55:09:EC"
];

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
  fingerprints,
  url,
  entry: platform === "win32" ? "op.exe" : "op",
  version
};
