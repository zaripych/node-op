import fs from 'fs/promises';
import { isString } from 'util';

import { spawnAndCheck } from './spawn';

export interface GetDocumentProps {
  uuid: string;
  vault?: string;
  outputFilePath: string;
  force?: boolean;
  verbosity: number;
}

export async function getDocument(props: GetDocumentProps) {
  const forceOverwrite = props.force ?? false;

  const outStream = await fs.open(
    props.outputFilePath,
    forceOverwrite ? 'w' : 'wx'
  );

  await spawnAndCheck(
    'op',
    [
      'get',
      'document',
      props.uuid,
      props.vault && `--vault=${props.vault}`,
    ].filter(isString),
    {
      env: process.env,
      verbosity: props.verbosity,
      stdio: ['inherit', outStream.fd, 'pipe'],
    }
  );
}
