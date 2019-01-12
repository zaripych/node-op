const os = require("os");
const pack = require("./package.json");

const fingerprint =
  "57:49:78:F8:DB:81:3C:09:39:B9:0D:3D:E8:BA:96:2C:13:A2:77:B3";

const contributeUrl = pack.homepage;
const version = pack.op_version;

const config = {
  darwin: {
    universal: `https://cache.agilebits.com/dist/1P/op/pkg/v${version}/op_darwin_amd64_v${version}.zip`
  },
  linux: {
    x64: `https://cache.agilebits.com/dist/1P/op/pkg/v${version}/op_linux_386_v${version}.zip`
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
  fingerprint,
  url,
  entry: platform === "win32" ? "op.exe" : "op",
  version
};
