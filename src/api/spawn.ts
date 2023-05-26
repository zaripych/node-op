import type { ChildProcess, SpawnOptions } from 'child_process';
import { spawn, spawnSync } from 'child_process';
import { EOL } from 'os';
import { delimiter, resolve } from 'path';
import { fileURLToPath } from 'url';

const prepare = () => {
  let binariesPath = resolve(fileURLToPath(new URL('../bin', import.meta.url)));
  if (binariesPath.endsWith('src/bin')) {
    binariesPath = resolve(binariesPath, '../../bin');
  }
  const path = process.env['PATH'];
  if (!path || !path.includes(binariesPath)) {
    process.env['PATH'] = [binariesPath, process.env['PATH']].join(delimiter);
  }
};

export function spawnSyncAndCheck(
  ...args: Parameters<typeof spawnSync>
): string {
  const [cmd, optsOrArgs, opts] = args;
  prepare();
  const proc = spawnSync(cmd, Array.isArray(optsOrArgs) ? optsOrArgs : [], {
    ...opts,
    encoding: 'utf8',
  });

  if (proc.error) {
    throw new Error(`cannot start ${cmd}: ${String(proc.error.stack)}`);
  }

  if (proc.signal) {
    throw new Error(`${cmd} crashed with ${proc.signal}`);
  }

  if (proc.status !== 0) {
    throw new Error(`${cmd} quit with non-zero code: ${String(proc.status)}`);
  }

  return proc.output.join('');
}

export function spawnAndCheck<R = string>(
  command: string,
  args: ReadonlyArray<string>,
  options: SpawnOptions & {
    verbosity: number;
    expectedExitCodes?: number[];
    appendOutputToError?: boolean;
    created?: (cp: ChildProcess) => void;
    chooseReturn?: (code?: number, signal?: string, output?: string) => R;
  }
): Promise<R> {
  const expectedExitCodes = options.expectedExitCodes ?? [0];
  const appendOutputToError = options.appendOutputToError ?? false;

  prepare();

  if (options.verbosity > 0) {
    console.log([command, ...args].join(' '));
  }

  const proc = spawn(command, args, options);

  if (options.created) {
    options.created(proc);
  }

  const output: string[] = [];

  if (proc.stderr) {
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', (chunk: string) => {
      output.push(chunk);
      if (options.verbosity > 1) {
        console.error(chunk);
      }
    });
  }

  if (proc.stdout) {
    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (chunk: string) => {
      output.push(chunk);
      if (options.verbosity > 1) {
        console.log(chunk);
      }
    });
  }

  const chooseReturn =
    options.chooseReturn ??
    ((_code?: number, _signal?: string, out?: string) => out);

  return new Promise((res, rej) => {
    const exitHandler = (code?: number, signal?: string) => {
      if (typeof code !== 'number' || !expectedExitCodes.includes(code)) {
        const additional = appendOutputToError
          ? `${EOL}${output.join('').trim()}`
          : '';
        if (typeof code === 'number') {
          rej(
            new Error(
              `process "${command}" quit with non-zero code: ${code}${additional}`
            )
          );
        } else {
          rej(
            new Error(
              `process "${command}" was terminated with ${String(
                signal
              )}${additional}`
            )
          );
        }
      } else {
        res(chooseReturn(code, signal, output.join('')) as R);
      }
    };

    proc.on('error', (err) => {
      rej(err);
    });
    proc.on('exit', exitHandler);
  });
}
