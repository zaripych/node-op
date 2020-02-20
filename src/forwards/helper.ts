import { spawn } from 'child_process';

export function runOp(command: string) {
  spawn('./dist/binaries/op', [command, ...process.argv.slice(2)], {
    stdio: ['inherit', 'inherit', 'inherit'],
    env: process.env,
    cwd: process.cwd(),
  });
}
