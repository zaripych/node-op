import { spawnAndCheck } from './spawn';

interface DiffProps {
  fileOurs: string;
  fileTheirs: string;
  verbosity: number;
}

export async function gitDiffFiles(props: DiffProps) {
  const result = await spawnAndCheck(
    'git',
    ['diff', '--no-index', '--color', '--', props.fileTheirs, props.fileOurs],
    {
      verbosity: props.verbosity,
      expectedExitCodes: [0, 1],
    }
  );
  return result.trim();
}
