import { isString } from 'util';

import { spawnAndCheck } from './spawn';

export interface DeleteItemProps {
  uuid: string;
  vault?: string;
  verbosity: number;
}

export async function trashItem(props: DeleteItemProps) {
  await spawnAndCheck(
    'op',
    [
      'delete',
      'item',
      props.uuid,
      props.vault && `--vault=${props.vault}`,
    ].filter(isString),
    {
      env: process.env,
      verbosity: props.verbosity,
      stdio: ['inherit', 'pipe', 'pipe'],
    }
  );
}
