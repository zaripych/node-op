const https = require("https");
const fs = require("fs");
const stream = require("stream");
const AdmZip = require("adm-zip");
const { promisify } = require("util");

const { url, fingerprint, contributeUrl } = require("./index");

const mkdir = promisify(fs.mkdir);
const pipeline = promisify(stream.pipeline);
const chmod = promisify(fs.chmod);

if (
  fs.existsSync("./lib/package.zip") &&
  fs.existsSync("./lib/op") &&
  fs.existsSync("./lib/op.sig")
) {
  console.log(
    "node-op: Binary already downloaded and unpacked, skipping installation ... "
  );
  return;
}

console.log("node-op: Will download the library ... ");

const req = https.get(url, res => {
  if (res.statusCode !== 200) {
    throw new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`);
  }

  mkdir("./lib")
    .catch(() => Promise.resolve())
    .then(() => {
      const outFile = fs.createWriteStream("./lib/package.zip");
      return pipeline(res, outFile).catch(err => {
        res.destroy();
        outFile.destroy();

        throw new Error(
          `Cannot download the package from url '${url}'. ${err.message}`
        );
      });
    })
    .then(() => {
      const zip = new AdmZip("./lib/package.zip");
      zip.extractEntryTo("op", "./lib", false, true);
      zip.extractEntryTo("op.sig", "./lib", false, true);
    })
    .then(() => chmod("./lib/op", 0755))
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
    const serverFingerprint = socket.getPeerCertificate().fingerprint;

    if (!socket.authorized) {
      req.emit("error", new Error("Unauthorized"));
      req.abort();
      return;
    }

    if (serverFingerprint !== fingerprint) {
      req.emit(
        "error",
        new Error(
          `Fingerprint doesn\'t match. This is probably due to One Password Download website reissuing certificate. Contribute by updating it: ${contributeUrl}`
        )
      );
      req.abort();
      return;
    }
  });
});

req.end();
