import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import { readdirSync } from 'fs';
import { basename, resolve as resolveFilePath } from 'path';

const babelConfig = require('./babel.config.rollup');

const extensions = ['.js', '.ts', '.tsx'];

function resolveOriginalFs() {
  return {
    resolveId(source) {
      if (source === 'original-fs') {
        return { id: 'fs', external: true };
      }
      if (source === 'react-devtools-core') {
        return {
          id: resolveFilePath(__dirname, './src/empty.ts'),
          external: false,
        };
      }
      return null;
    },
  };
}

const baseConfig = {
  external: [
    'yoga-layout-prebuilt',
    'path',
    'child_process',
    'crypto',
    'util',
    'fs',
    'events',
    'os',
    'https',
    'tty',
    'assert',
    'zlib',
    'stream',
    'constants',
    'url',
    'module',
    'tls',
    'net',
    'http',
  ],
  plugins: [
    resolveOriginalFs(),
    resolve({
      extensions,
      preferBuiltins: true,
    }),
    json(),
    commonjs({
      ignore: ['bufferutil', 'utf-8-validate'],
    }),
    babel({
      ...babelConfig,
      exclude: 'node_modules/**',
      extensions,
      babelHelpers: 'bundled',
    }),
  ],
};

const mainInput = {
  ...baseConfig,
  input: {
    cli: './src/cli',
    installOp: './src/installOp',
    vaultCheckin: './src/vaultCheckin',
    vaultCheckout: './src/vaultCheckout',
    vaultDiff: './src/vaultDiff',
    interactive: './src/interactive',
  },
  output: {
    chunkFileNames: 'chunk-[hash].js',
    dir: './dist',
    format: 'cjs',
  },
};

const forwards = readdirSync('./src/forwards/')
  .map((file) => basename(file.replace('.ts', '')))
  .filter((item) => !['helper'].includes(item));

export default [
  mainInput,
  {
    ...baseConfig,
    input: forwards.reduce(
      (acc, forward) => ({
        ...acc,
        [forward]: ['./src/forwards/', forward].join(''),
      }),
      {}
    ),
    output: {
      chunkFileNames: 'chunk-[hash].js',
      dir: './dist/forwards',
      format: 'cjs',
    },
  },
];
