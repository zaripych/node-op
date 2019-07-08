const https = require("https");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const pump = require("pump");
const AdmZip = require("adm-zip");
const { promisify } = require("util");

const {
  url,
  entry,
  version,
  validateCertificate,
  contributeUrl
} = require("./index");

const mkdir = promisify(fs.mkdir);
const pipeline = (req, file) => {
  return new Promise((res, rej) => {
    pump(req, file, err => {
      if (err) {
        rej(err);
      } else {
        res();
      }
    });
  });
};
const chmod = promisify(fs.chmod);

const libDir = "./lib/";
const packagePath = path.join(libDir, "package.zip");
const opPath = path.join(libDir, entry);

function getOpVersion() {
  const result = spawnSync(opPath, ["--version"], { encoding: "utf8" });
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

if (
  fs.existsSync(packagePath) &&
  fs.existsSync(opPath) &&
  fs.existsSync(opPath + ".sig")
) {
  console.log(
    "node-op: The binary already downloaded and unpacked, checking version ... "
  );
  const currentVersion = getOpVersion();
  if (currentVersion === version) {
    console.log("node-op: Version matches", version);
    console.log("");
    return 0;
  }
}

console.log("node-op: Will download the binary ... ");

const req = https.get(url, res => {
  if (res.statusCode !== 200) {
    throw new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`);
  }

  mkdir("./lib")
    .catch(() => Promise.resolve())
    .then(() => {
      const outFile = fs.createWriteStream(packagePath);
      return pipeline(res, outFile).catch(err => {
        res.destroy();
        outFile.destroy();

        throw new Error(
          `Cannot download and save the package from url '${url}' to file '${packagePath}'. ${
            err.message
          }`
        );
      });
    })
    .then(() => {
      const zip = new AdmZip(packagePath);
      zip.extractEntryTo(entry, libDir, false, true);
      zip.extractEntryTo(entry + ".sig", libDir, false, true);
    })
    .then(() => chmod(opPath, 0755))
    .then(() => {
      const semVer = /\d+\.\d+\.\d+/.exec(version)[0];
      const currentVersion = getOpVersion();
      if (currentVersion !== semVer) {
        throw new Error(
          `The downloaded version ${currentVersion} doesn\'t match ${version}`
        );
      }
      console.log("node-op: Downloaded version", version);
    })
    .then(() => {
      console.log("");
    })
    .catch(err => {
      console.error(err);
      process.exit(-1);
    });
});

req.on("error", err => {
  console.error(err);
  process.exit(-1);
});

req.on("socket", socket => {
  socket.on("secureConnect", () => {
    if (!socket.authorized) {
      req.emit("error", new Error("Unauthorized"));
      req.abort();
      return;
    }

    const certificate = socket.getPeerCertificate();

    const result = validateCertificate(certificate);

    if (!result.isValid) {
      req.emit(
        "error",
        new Error(
          [
            "Certificate is not valid.",
            result.message,
            `Contribute by updating validation logic for it: ${contributeUrl}`
          ]
            .filter(Boolean)
            .join(" ")
        )
      );
      req.abort();
      return;
    }
  });
});

req.end();
