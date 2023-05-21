import { randomBytes } from 'crypto';
import { stat, unlink, writeFile } from 'fs/promises';
import { basename } from 'path';

import type { Item } from '../api';
import { getDocument, gitDiffFiles, listItems, rethrowAsync } from '../api';

interface DiffProps {
  vault?: string;
  files: string[];
  verbosity?: number;
}

function findSingleFile(file: string, items: Item[]) {
  const title = basename(file);
  const filtered = items.filter((item) => title === item.overview.title);

  if (filtered.length === 0) {
    return null;
  }

  if (filtered.length > 1) {
    throw new Error(
      `More than one document with title '${title}' found: [${filtered
        .map((item) => `"${item.uuid}"`)
        .join(', ')}]`
    );
  }

  return filtered[0];
}

async function validateFile(file: string, items: Item[], deps = { stat }) {
  const result = await deps.stat(file);
  if (!result.isFile()) {
    throw new Error(`file at path '${file}' is not a file`);
  }
  return findSingleFile(file, items);
}

async function diffFile(
  props: DiffProps,
  file: string,
  compareUuid?: string,
  deps = {
    getDocument,
    writeFile,
    unlink,
    gitDiffFiles,
  }
) {
  const verbosity = props.verbosity ?? 0;

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
        : deps.writeFile(fileTheirs, '', { encoding: 'utf-8' }),
    (errInfo) =>
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
    (errInfo) =>
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
  props: DiffProps,
  deps = {
    listItems,
    stat,
    unlink,
    getDocument,
    writeFile,
    gitDiffFiles,
  }
) {
  if (typeof props !== 'object') {
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

  const verbosity = props.verbosity ?? 0;

  const items = await rethrowAsync(
    () =>
      deps.listItems({
        verbosity,
        ...(props.vault && { vault: props.vault }),
      }),
    (errInfo) => errInfo.withMessage('Cannot list items in 1-Password vault')
  );

  const filesAndItems = await Promise.all(
    props.files.map((file) =>
      validateFile(file, items, {
        stat: deps.stat,
      }).then((item) => ({
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
          writeFile: deps.writeFile,
          gitDiffFiles: deps.gitDiffFiles,
        })
      ),
    Promise.resolve()
  );
}
