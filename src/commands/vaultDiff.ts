import {
  listItems,
  IItem,
  getDocument,
  rethrowAsync,
  gitDiffFiles,
} from '../api';
import { stat, unlink, createFile } from 'fs-extra';
import { basename } from 'path';
import { randomBytes } from 'crypto';

interface IDiffProps {
  vault?: string;
  files: string[];
  verbosity?: number;
}

function findSingleFile(file: string, items: IItem[]) {
  const title = basename(file);
  const filtered = items.filter(item => title === item?.overview?.title);

  if (filtered.length === 0) {
    return null;
  }

  if (filtered.length > 1) {
    throw new Error(
      `More than one document with title '${title}' found: [${filtered
        .map(item => `"${item.uuid}"`)
        .join(', ')}]`
    );
  }

  return filtered[0];
}

async function validateFile(file: string, items: IItem[], deps = { stat }) {
  const result = await deps.stat(file);
  if (!result.isFile()) {
    throw new Error(`file at path '${file}' is not a file`);
  }
  return findSingleFile(file, items);
}

async function diffFile(
  props: IDiffProps,
  file: string,
  compareUuid?: string,
  deps = {
    getDocument,
    createFile,
    unlink,
    gitDiffFiles,
  }
) {
  const verbosity = props?.verbosity ?? 0;

  const fileTheirs = `${file}.orig.${randomBytes(8).toString('hex')}`;

  await rethrowAsync(
    () =>
      compareUuid
        ? deps.getDocument({
            verbosity,
            outputFilePath: fileTheirs,
            uuid: compareUuid,
            ...(props.vault && { vault: props.vault }),
          })
        : deps.createFile(fileTheirs),
    errInfo =>
      errInfo.withMessage(
        `Cannot download previous version of "${file}" from 1-Password`
      )
  );

  const diff = await deps.gitDiffFiles({
    fileOurs: file,
    fileTheirs,
    verbosity,
  });

  await rethrowAsync(
    () => deps.unlink(fileTheirs),
    errInfo =>
      errInfo.withMessage(
        `Cannot delete original version of file "${file}" at "${fileTheirs}". Please delete it manually.`
      )
  );

  if (!diff) {
    console.log(`# No changes for "${file}"`);
  } else {
    console.log(diff);
  }
}

export async function vaultDiff(
  props: IDiffProps,
  deps = {
    listItems,
    stat,
    unlink,
    getDocument,
    createFile,
    gitDiffFiles,
  }
) {
  // tslint:disable-next-line: strict-boolean-expressions
  if (!props || typeof props !== 'object') {
    throw new TypeError('no properties passed');
  }

  if (typeof props.vault !== 'undefined' && typeof props.vault !== 'string') {
    throw new TypeError('vault should be a string');
  }

  if (
    typeof props.verbosity !== 'undefined' &&
    (typeof props.verbosity !== 'number' ||
      ![0, 1, 2].includes(props.verbosity))
  ) {
    throw new TypeError('verbosity should be a number: 0, 1 or 2');
  }

  if (!Array.isArray(props.files) || props.files.length === 0) {
    throw new TypeError('files should be a non-empty array of strings');
  }

  const verbosity = props?.verbosity ?? 0;

  const items = await rethrowAsync(
    () =>
      deps.listItems({
        verbosity,
        ...(props.vault && { vault: props.vault }),
      }),
    errInfo => errInfo.withMessage('Cannot list items in 1-Password vault')
  );

  const filesAndItems = await Promise.all(
    props.files.map(file =>
      validateFile(file, items, {
        stat: deps.stat,
      }).then(item => ({
        file,
        uuid: item?.uuid,
      }))
    )
  );

  const logAndContinue = (err: Error) => {
    console.error(err.message);
    return Promise.resolve();
  };

  await filesAndItems.reduce(
    (prev, next) =>
      prev.catch(logAndContinue).then(() =>
        diffFile(props, next.file, next.uuid, {
          getDocument: deps.getDocument,
          unlink: deps.unlink,
          createFile: deps.createFile,
          gitDiffFiles: deps.gitDiffFiles,
        })
      ),
    Promise.resolve()
  );
}
