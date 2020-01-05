import { spawnSync, spawn, SpawnOptions } from 'child_process';
import { EOL } from 'os';

export function spawnSyncAndCheck(
  ...args: Parameters<typeof spawnSync>
): string {
  const [cmd, optsOrArgs, opts] = args;
  const proc = spawnSync(cmd, Array.isArray(optsOrArgs) ? optsOrArgs : [], {
    ...opts,
    encoding: 'utf8',
  });

  if (proc.error) {
    throw new Error(`cannot start ${cmd}: ${proc.error.stack}`);
  }

  if (proc.signal) {
    throw new Error(`${cmd} crashed with ${proc.signal}`);
  }

  if (proc.status !== 0) {
    throw new Error(`${cmd} quit with non-zero code: ${proc.status}`);
  }

  return proc.output.join('');
}

export function spawnAndCheck(
  command: string,
  args: ReadonlyArray<string>,
  options: SpawnOptions & {
    verbosity: number;
    expectedExitCodes?: number[];
    appendOutputToError?: boolean;
  }
): Promise<string> {
  const expectedExitCodes = options?.expectedExitCodes ?? [0];
  const appendOutputToError = options?.appendOutputToError ?? false;

  if (options.verbosity > 0) {
    console.log([command, ...(args ?? [])].join(' '));
  }

  const proc = spawn(command, args ?? [], options ?? {});

  const output: string[] = [];

  if (proc.stderr as NodeJS.ReadableStream | null) {
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', (chunk: string) => {
      output.push(chunk);
      if (options.verbosity > 1) {
        console.error(chunk);
      }
    });
  }

  if (proc.stdout as NodeJS.ReadableStream | null) {
    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (chunk: string) => {
      output.push(chunk);
      if (options.verbosity > 1) {
        console.log(chunk);
      }
    });
  }

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
              `process "${command}" was terminated with ${signal}${additional}`
            )
          );
        }
      } else {
        res(output.join(''));
      }
    };

    proc.on('error', err => {
      rej(err);
    });
    proc.on('exit', exitHandler);
  });
}
