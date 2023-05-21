import { basename } from 'path';
import { isError } from 'util';

import type { Item } from '../api';
import { catchAsync, getDocument, listItems, rethrowAsync } from '../api';

export interface CheckoutProps {
  vault?: string;
  files: string[];
  force?: boolean;
  verbosity?: number;
}

async function processFile(
  props: CheckoutProps,
  file: string,
  items: Item[],
  deps = {
    getDocument,
  }
) {
  const title = basename(file);
  const filtered = items.filter((item) => title === item.overview.title);

  if (filtered.length === 0) {
    throw new Error(`No document with title '${file}' found`);
  }

  if (filtered.length > 1) {
    throw new Error(`More than one document with title '${file}' found`);
  }

  const firstFiltered = filtered[0];
  const verbosity = props.verbosity ?? 0;

  if (!firstFiltered) {
    throw new Error();
  }

  return await rethrowAsync(
    () =>
      deps.getDocument({
        verbosity,
        uuid: firstFiltered.uuid,
        outputFilePath: file,
        ...(props.vault && { vault: props.vault }),
        ...(typeof props.force === 'boolean' && { force: props.force }),
      }),
    (errInfo) =>
      errInfo.withMessage('Cannot download document from 1-Password vault')
  );
}

export async function vaultCheckout(
  props: CheckoutProps,
  /**
   * @ignore
   */
  deps = {
    listItems,
    getDocument,
  }
) {
  if (typeof props !== 'object') {
    throw new TypeError('no properties passed');
  }

  if (typeof props.vault !== 'undefined' && typeof props.vault !== 'string') {
    throw new TypeError('vault should be a string');
  }

  if (typeof props.force !== 'undefined' && typeof props.force !== 'boolean') {
    throw new TypeError('force should be a boolean');
  }

  if (!Array.isArray(props.files) || props.files.length === 0) {
    throw new TypeError('files should be a non-empty array of strings');
  }

  const verbosity = props.verbosity ?? 0;

  const items = await rethrowAsync(
    () =>
      deps.listItems({
        ...(props.vault && { vault: props.vault }),
        verbosity,
      }),
    (errInfo) => errInfo.withMessage('Cannot list items in 1-Password vault')
  );

  const results = await Promise.all(
    props.files.map((file) =>
      catchAsync(() =>
        processFile(props, file, items, {
          getDocument: deps.getDocument,
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
      throw new AggregateError([first, ...rest], 'Multiple errors occurred');
    } else {
      throw errorResults[0];
    }
  }
}
