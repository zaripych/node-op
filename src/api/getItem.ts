import { isString } from 'util';

import type { ItemDetails } from './item';
import { spawnAndCheck } from './spawn';

export interface GetItemProps {
  uuid: string;
  vault?: string;
  verbosity: number;
}

export async function getItem(props: GetItemProps) {
  const result = await spawnAndCheck(
    'op',
    ['get', 'item', props.uuid, props.vault && `--vault=${props.vault}`].filter(
      isString
    ),
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
      appendOutputToError: true,
      verbosity: 0,
    }
  );

  return JSON.parse(result.trim()) as ItemDetails;
}
