import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from 'rollup-plugin-babel';
import json from '@rollup/plugin-json';
import { readdirSync } from 'fs-extra';
import { basename } from 'path';

const babelConfig = require('./babel.config.rollup');

const extensions = ['.js', '.ts', '.tsx'];

function resolveOriginalFs() {
  return {
    resolveId(source) {
      if (source === 'original-fs') {
        return { id: 'fs', external: true };
      }
      return null;
    },
  };
}

const mainInput = {
  input: {
    cli: './src/cli',
    installOp: './src/installOp',
    vaultCheckin: './src/vaultCheckin',
    vaultCheckout: './src/vaultCheckout',
    vaultDiff: './src/vaultDiff',
    interactive: './src/interactive',
  },
  external: ['yoga-layout-prebuilt'],
  output: {
    chunkFileNames: 'chunk-[hash].js',
    dir: './dist',
    format: 'cjs',
    sourcemap: true,
  },
  plugins: [
    resolveOriginalFs(),
    resolve({
      extensions,
      preferBuiltins: true,
    }),
    json(),
    commonjs({
      namedExports: {
        'rxjs-spy/operators': ['tag'],
        'node_modules/ink/build/index.js': [
          'render',
          'Box',
          'Color',
          'Text',
          'StdinContext',
          'useInput',
        ],
        'node_modules/fs-extra/lib/index.js': [
          'stat',
          'unlink',
          'createFile',
          'writeFile',
          'existsSync',
          'createWriteStream',
          'chmod',
          'mkdir',
          'removeSync',
        ],
      },
    }),
    babel({
      ...babelConfig,
      exclude: 'node_modules/**',
      extensions,
    }),
  ],
};

const forwards = readdirSync('./src/forwards/')
  .map((file) => basename(file.replace('.ts', '')))
  .filter((item) => !['helper'].includes(item));

const forwardsConfig = forwards.map((item) => ({
  ...mainInput,
  input: ['./src/forwards/', item].join(''),
  output: {
    file: ['./dist/forwards/', item, '.js'].join(''),
    format: 'cjs',
    sourcemap: true,
  },
}));

export default [mainInput, ...forwardsConfig];
