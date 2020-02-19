import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from 'rollup-plugin-babel';
import json from '@rollup/plugin-json';

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

export default {
  input: {
    installOp: './src/installOp.js',
    vaultCheckin: './src/vaultCheckin.ts',
    vaultCheckout: './src/vaultCheckout.ts',
    vaultDiff: './src/vaultDiff.ts',
    interactive: './src/interactive.ts',
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
