import { spawnAndCheck } from './spawn';

export interface ICopyProps {
  value: string;
}

async function clipboardCopyOSC52(value: string) {
  await new Promise((res, rej) => {
    process.stderr.write(
      `\x1b]52;c;${Buffer.from(value).toString('base64')}\x07`,
      (err: Error | null) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      }
    );
  });
}

export async function clipboardCopy(props: ICopyProps) {
  if (process.platform === 'linux' && !process.env.DISPLAY) {
    await clipboardCopyOSC52(props.value);
  } else if (process.platform === 'linux') {
    await spawnAndCheck('xsel', ['--clipboard', '--input'], {
      created: (cp) => {
        cp.stdin.write(props.value, (err) => {
          if (err) {
            cp.emit('error', err);
          }
          cp.stdin.end();
        });
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
      verbosity: 0,
      appendOutputToError: true,
    });
  } else if (process.platform === 'darwin') {
    await spawnAndCheck('pbcopy', [], {
      created: (cp) => {
        cp.stdin.write(props.value, (err) => {
          if (err) {
            cp.emit('error', err);
          }
          cp.stdin.end();
        });
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
      verbosity: 0,
    });
  } else {
    await clipboardCopyOSC52(props.value);
  }
}
