import { stat, unlink } from 'fs/promises';
import { basename } from 'path';
import { isError } from 'util';

import type { Item } from '../api';
import {
  catchAsync,
  createDocument,
  listItems,
  rethrowAsync,
  trashItem,
} from '../api';

interface CheckinProps {
  vault?: string;
  files: string[];
  dryRun?: boolean;
  trash?: boolean;
  keepLocal?: boolean;
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

async function validateFile(
  file: string,
  items: Item[],
  deps = { stat: (path: string) => stat(path) }
) {
  const result = await deps.stat(file);
  if (!result.isFile()) {
    throw new Error(`file at path '${file}' is not a file`);
  }
  return findSingleFile(file, items);
}

async function processFile(
  props: CheckinProps,
  file: string,
  trashUuid?: string,
  deps = {
    createDocument,
    trashItem,
    unlink,
  }
) {
  const verbosity = props.verbosity ?? 0;

  const newUuid = await rethrowAsync(
    () =>
      deps.createDocument({
        verbosity,
        file,
        ...(props.vault && { vault: props.vault }),
      }),
    (errInfo) =>
      errInfo.withMessage(
        `Cannot create new document in 1-Password vault from file "${file}"`
      )
  );

  const trash = async () => {
    const shouldTrash = props.trash ?? true;
    if (!trashUuid || !shouldTrash) {
      return;
    }

    await rethrowAsync(
      () =>
        deps.trashItem({
          verbosity,
          uuid: trashUuid,
          ...(props.vault && { vault: props.vault }),
        }),
      (errInfo) =>
        errInfo.withMessage(
          `Cannot delete previous version of the document from 1-Password vault, with new document id "${newUuid}" and old document id "${trashUuid}"`
        )
    );
  };

  const deleteLocal = async () => {
    const shouldKeepLocal = props.keepLocal ?? false;

    if (shouldKeepLocal) {
      return;
    }

    await rethrowAsync(
      async () => {
        if (verbosity > 0) {
          console.log(`Deleting "${file}"`);
        }
        await deps.unlink(file);
      },
      (errInfo) =>
        errInfo.withMessage(
          `Cannot delete local file at "${file}" after successfull 1-Password vault upload`
        )
    );
  };

  await trash();
  await deleteLocal();
}

export async function vaultCheckin(
  props: CheckinProps,
  deps = {
    listItems,
    createDocument,
    trashItem,
    stat: (path: string) => stat(path),
    unlink,
  }
) {
  if (typeof props !== 'object') {
    throw new TypeError('no properties passed');
  }

  if (typeof props.vault !== 'undefined' && typeof props.vault !== 'string') {
    throw new TypeError('vault should be a string');
  }

  if (typeof props.trash !== 'undefined' && typeof props.trash !== 'boolean') {
    throw new TypeError('trash should be a boolean');
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

  if (verbosity > 0) {
    console.log(
      'Will upload files',
      filesAndItems.map((item) => item.file)
    );
    const toTrash = filesAndItems.filter((item) => !!item.uuid);
    console.log('Following 1-Password items going to be trashed', toTrash);
  }

  if (props.dryRun ?? false) {
    return;
  }

  const results = await Promise.all(
    filesAndItems.map((pair) =>
      catchAsync(() =>
        processFile(props, pair.file, pair.uuid, {
          createDocument: deps.createDocument,
          trashItem: deps.trashItem,
          unlink: deps.unlink,
        })
      )
    )
  );

  const errorResults = results.map((item) => item.error).filter(isError);

  if (errorResults.length > 0) {
    if (errorResults.length > 1) {
      const [first, ...rest] = errorResults;
      if (!first) {
        throw new Error();
      }
      throw new AggregateError([first, ...rest]);
    } else {
      throw errorResults[0];
    }
  }
}
