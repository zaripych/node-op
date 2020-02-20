import commander from 'commander';
import { start } from './commands/interactive';

const program = new commander.Command();

// tslint:disable-next-line:no-unused-expression
program
  .description('Lookup for passwords in interactive terminal')
  .exitOverride(err => {
    if (err.message === '(outputHelp)') {
      return;
    }
    program.outputHelp();
    process.exit(err.exitCode);
  })
  .action(() => {
    start();
  })
  .parse(process.argv) as commander.Command & {};
