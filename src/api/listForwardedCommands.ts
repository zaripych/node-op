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

  const searchStrings = ['Available commands are:', 'Available Commands:'];
  const searchStringIndex = searchStrings
    .map(str => result.indexOf(str))
    .findIndex(item => item >= 0);

  if (searchStringIndex === -1) {
    return [];
  }

  const searchString = searchStrings[searchStringIndex];
  const index = result.indexOf(searchString);

  const stopString = 'Flags:';
  const endIndex = result.indexOf(stopString);

  if (index === -1) {
    return [];
  }

  const list = result
    .substring(
      index + searchString.length,
      endIndex >= 0 ? endIndex : undefined
    )
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
