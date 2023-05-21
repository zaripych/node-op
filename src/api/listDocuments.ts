import { isString } from 'util';

import type { Item } from './item';
import { spawnAndCheck } from './spawn';

export interface ListDocumentsProps {
  vault?: string;
  verbosity: number;
}

export async function listDocuments(props?: ListDocumentsProps) {
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
  return JSON.parse(result) as Item[];
}
