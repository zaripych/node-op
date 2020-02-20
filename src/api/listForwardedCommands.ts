import { spawnAndCheck } from './spawn';
import { isTruthy } from '../commands/interactive/building-blocks/helpers';

export interface ICommand {
  command: string;
  description: string;
}

export async function listForwardedCommands(
  opPath = 'op'
): Promise<ICommand[]> {
  const result = await spawnAndCheck(opPath, ['--help'], {
    env: process.env,
    verbosity: 0,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const searchString = 'Available commands are:';
  const index = result.indexOf(searchString);

  if (index === -1) {
    return [];
  }

  const list = result
    .substring(index + searchString.length)
    .trim()
    .split('\n')
    .map(entry => entry.trim());

  return list
    .map(entry => {
      const wsIndex = entry.search(/\s/);
      if (wsIndex === -1) {
        return null;
      }

      const command = entry.substring(0, wsIndex).trim();
      const description = entry.substring(wsIndex).trim();

      return {
        command,
        description,
      };
    })
    .filter(isTruthy);
}
