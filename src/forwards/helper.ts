import { spawn } from 'child_process';
import { fileURLToPath, URL } from 'url';

export function runOp(command: string) {
  const cmd = fileURLToPath(new URL('../bin/op', import.meta.url));
  spawn(cmd, [command, ...process.argv.slice(2)], {
    stdio: ['inherit', 'inherit', 'inherit'],
    env: process.env,
    cwd: process.cwd(),
  });
}
