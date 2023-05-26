import { buildForNode, copy, pipeline } from '@repka-kit/ts';
import { readdir } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

await pipeline(
  buildForNode({
    externals: [
      'react-devtools-core',
      'yoga-wasm-web',
      'yoga-wasm-web/auto',
      // 'ink',
      // 'react',
      // 'react-dom',
    ],

    resolveId: (id, importer) => {
      if (id === 'original-fs') {
        return { id: 'node:fs', external: true };
      }

      if (id.endsWith('.conditional')) {
        const result = resolve(
          importer ? dirname(importer) : process.cwd(),
          id.replace('.conditional', '.prod.ts')
        );
        return { id: result, external: false };
      }

      return null;
    },

    extraRollupConfigs: async (opts) => {
      const forwards = await readdir('./src/forwards');
      const defaultConfig = opts.defaultRollupConfig();

      return [
        {
          ...defaultConfig,
          output: {
            ...defaultConfig.output,
            dir: './dist/forwards',
          },
          input: Object.fromEntries(
            forwards.map((forward) => [
              forward.replace('.ts', ''),
              join('./src/forwards/', forward),
            ])
          ),
        },
      ];
    },

    outputPackageJson: (packageJson) => ({
      ...packageJson,
      bin: {
        op: './bin/op',
        ...(typeof packageJson.bin === 'object' && packageJson.bin),
      },
      scripts: {
        postinstall: 'node ./dist/installOp.js',
      },
    }),
  }),
  copy({
    source: './src/binaries',
    include: ['op', 'op.cmd'],
    destination: './dist/bin',
  }),
  copy({
    source: '.',
    include: ['README.md'],
    destination: './dist',
  }),
  async () => {
    const { installOnePassword } = await import('./src/api/installOp');
    await installOnePassword(fileURLToPath(new URL('./bin', import.meta.url)));
  }
);
