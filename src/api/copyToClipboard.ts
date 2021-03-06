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

const xselExists = async () => {
  const result = await spawnAndCheck('which', ['xsel'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    verbosity: 0,
    env: process.env,
    expectedExitCodes: [0, 1],
    chooseReturn: (code) => code,
  });
  return result === 0;
};

export async function clipboardCopy(props: ICopyProps) {
  const xselAvailable =
    process.platform === 'linux' && process.env.DISPLAY && (await xselExists());
  if (xselAvailable) {
    try {
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
    } catch (e) {
      await clipboardCopyOSC52(props.value);
    }
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
