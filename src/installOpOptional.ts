export const run = async () => {
  const cwd = process.cwd();
  const initCwd = process.env['INIT_CWD'];

  // This prevents installation from being run during development:
  if (initCwd === cwd || (initCwd && initCwd.indexOf(cwd) === 0)) {
    // ignore
  } else {
    await import('./api/installOp')
      .then(async ({ installOnePassword }) => installOnePassword())
      .catch((err) => {
        console.error(err);
        process.exitCode = 1;
      });
  }
};

await run();
