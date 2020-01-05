import { spawnAndCheck } from './spawn';
import { isString } from 'util';
import { IItem } from './item';

export interface IListDocumentsProps {
  vault?: string;
  verbosity: number;
}

export async function listDocuments(props?: IListDocumentsProps) {
  const result = await spawnAndCheck(
    'op',
    ['list', 'documents', props?.vault && `--vault=${props.vault}`].filter(
      isString
    ),
    {
      env: process.env,
      verbosity: props?.verbosity ?? 0,
      stdio: ['inherit', 'pipe', 'pipe'],
    }
  );
  return JSON.parse(result) as IItem[];
}
