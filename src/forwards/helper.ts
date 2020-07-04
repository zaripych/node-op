import { spawn } from 'child_process';
import { join } from 'path';

export function runOp(command: string) {
  const cmd = join(__dirname, '../binaries/op');
  spawn(cmd, [command, ...process.argv.slice(2)], {
    stdio: ['inherit', 'inherit', 'inherit'],
    env: process.env,
    cwd: process.cwd(),
  });
}
