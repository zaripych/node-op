const https = require("https");
const fs = require("fs");
const stream = require("stream");
const AdmZip = require("adm-zip");
const { promisify } = require("util");

const { url, fingerprint, contributeUrl } = require("./index");

const mkdir = promisify(fs.mkdir);
const pipeline = promisify(stream.pipeline);

const req = https.get(url, res => {
  mkdir("./bin")
    .catch(() => Promise.resolve())
    .then(() => {
      const outFile = fs.createWriteStream("./bin/package.zip");
      return pipeline(res, outFile).catch(err => {
        res.destroy();
        outFile.destroy();
        throw new Error(
          `Cannot download the package from url '${url}'. ${err.message}`
        );
      });
    })
    .then(() => {
      const zip = new AdmZip("./bin/package.zip");
      zip.extractEntryTo("op", "./bin", false, true);
      zip.extractEntryTo("op.sig", "./bin", false, true);
    });
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
