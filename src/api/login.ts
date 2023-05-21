import { isString } from 'util';

import { spawnAndCheck } from './spawn';

type Opts = {
  shorthand?: string;
  verbosity?: number;
};

export async function login(props?: Opts) {
  const shorthand = props?.shorthand ?? 'my';
  const result = await spawnAndCheck(
    'op',
    ['signin', shorthand, '--raw'].filter(isString),
    {
      env: process.env,
      verbosity: props?.verbosity ?? 0,
      stdio: ['inherit', 'pipe', 'pipe'],
      appendOutputToError: true,
    }
  );
  process.env[`OP_SESSION_${shorthand}`] = result.trim();
}
