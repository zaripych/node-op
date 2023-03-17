import { isString } from 'util';

import { catchAsync } from './catchAsync';
import type { IItem } from './item';
import { spawnAndCheck } from './spawn';

export interface ICreateDocumentProps {
  file: string;
  title?: string;
  vault?: string;
  verbosity: number;
}

export async function createDocument(props: ICreateDocumentProps) {
  const output = await spawnAndCheck(
    'op',
    [
      'create',
      'document',
      props.file,
      props.title && `--title=${props.title}`,
      props.vault && `--vault=${props.vault}`,
    ].filter(isString),
    {
      env: process.env,
      verbosity: props.verbosity,
      stdio: ['inherit', 'pipe', 'pipe'],
    }
  );

  const parsed = await catchAsync(() => JSON.parse(output) as IItem);

  if (parsed.error) {
    throw new Error(
      `Couldn't create document, cannot parse output "${output}" as JSON`
    );
  }

  return parsed.result.uuid;
}
