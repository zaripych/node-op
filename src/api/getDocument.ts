import { spawnAndCheck } from './spawn';
import { isString } from 'util';
import fs from 'fs-extra';

export interface IGetDocumentProps {
  uuid: string;
  vault?: string;
  outputFilePath: string;
  force?: boolean;
  verbosity: number;
}

export async function getDocument(props: IGetDocumentProps) {
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
      stdio: ['inherit', outStream, 'pipe'],
    }
  );
}
