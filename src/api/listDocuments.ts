import { isString } from 'util';

import type { IItem } from './item';
import { spawnAndCheck } from './spawn';

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
