#!/usr/bin/env node
// NOTE: This file is bundled up from './src/bin/*' and needs to be committed
import { spawn } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const isFile = async (file) => {
  return await stat(file)
    .then((result) => result.isFile())
    .catch(() => false);
};

async function findBin(startWith, binScriptPath) {
  let current = startWith;
  while (current !== '/' && current !== '~/') {
    const candidate = join(current, 'node_modules', binScriptPath);
    if (await isFile(candidate)) {
      return candidate;
    }
    current = dirname(current);
  }
}

const binPath = async (binName, binScriptPath) => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const bestGuess = join(root, 'node_modules', '.bin', binName);
  if (await isFile(bestGuess)) {
    return bestGuess;
  }
  const result = await findBin(root, binScriptPath);
  if (result) {
    return result;
  }
  throw new Error(`Cannot find bin ${binName}`);
};


const onError = (err) => {
  console.error(err);
  process.exitCode = 1;
};

binPath('tsx', 'tsx/dist/cli.js').then((result) => {
  const cp = spawn(
    result,
    [
      fileURLToPath(new URL('../src/bin/vault-checkout.ts', import.meta.url)),
      ...process.argv.slice(2),
    ],
    { stdio: 'inherit' }
  );
  cp.on('error', onError);
  cp.on('close', (code, signal) => {
    if (typeof code === 'number') {
      process.exitCode = code;
    } else if (typeof signal === 'string') {
      console.error('Failed to start', 'vault-checkout', signal);
    }
  });
}, onError);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmF1bHQtY2hlY2tvdXQuZ2VuLm1qcyIsInNvdXJjZXMiOltdLCJzb3VyY2VzQ29udGVudCI6W10sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsifQ==