import { spawnAndCheck } from './spawn';
import { isString } from 'util';
import { IItem } from './item';

export interface IListItemsProps {
  vault?: string;
  includeTrash?: boolean;
  verbosity: number;
}

export async function listItems(props?: IListItemsProps) {
  const result = await spawnAndCheck(
    'op',
    [
      'list',
      'items',
      typeof props?.includeTrash === 'boolean' && '--include-trash',
      props?.vault && `--vault=${props.vault}`,
    ].filter(isString),
    {
      env: process.env,
      verbosity: props?.verbosity ?? 0,
      stdio: ['inherit', 'pipe', 'pipe'],
      appendOutputToError: true,
    }
  );

  return JSON.parse(result) as IItem[];
}
