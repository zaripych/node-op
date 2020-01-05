import commander from 'commander';
import { vaultCheckout } from './commands/vaultCheckout';

const program = new commander.Command();

const parsed = program
  .description(
    'Download one or more files from 1-Password vault to current directory'
  )
  .exitOverride(err => {
    if (err.message === '(outputHelp)') {
      return;
    }
    program.outputHelp();
    process.exit(err.exitCode);
  })
  .option('-v --vault <vault-name>', 'vault to use')
  .option('--force', 'overwrite existing files', false)
  .requiredOption(
    '-f --files <title>',
    'list of files to checkout',
    (next: string, previous?: string[]) => {
      return [...(previous || []), next];
    }
  )
  .option(
    '--verbosity <0|1|2>',
    'verbosity of stdout',
    (next: string, previous?: number) => {
      if (typeof previous !== 'undefined') {
        throw new Error('Verbosity can be specified only once');
      }
      if (!['0', '1', '2'].includes(next)) {
        throw new Error('verbosity can be only 0, 1 or 2');
      }
      return parseInt(next, 10);
    }
  )
  .parse(process.argv) as commander.Command & {
  vault?: string;
  files: string[];
  force?: boolean;
  verbosity?: number;
};

async function run() {
  await vaultCheckout({
    vault: parsed.vault,
    files: parsed.files,
    force: parsed.force,
    verbosity: parsed.verbosity,
  });
}

run()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((err: Error) => {
    console.error(err.message);
    process.exitCode = 1;
  });
