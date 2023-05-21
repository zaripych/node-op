import { enableSourceMapsSupport } from './enableSourceMapSupport';

/**
 * A helper function to enable source maps support and then run code
 * in a module. This ensures that source maps are enabled before any
 * code is executed.
 */
export async function main(md: () => Promise<unknown>) {
  enableSourceMapsSupport();
  await md();
}
