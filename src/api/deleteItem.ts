import { spawnAndCheck } from './spawn';
import { isString } from 'util';

export interface IDeleteItemProps {
  uuid: string;
  vault?: string;
  verbosity: number;
}

export async function trashItem(props: IDeleteItemProps) {
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
