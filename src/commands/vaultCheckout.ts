import {
  listItems,
  IItem,
  getDocument,
  AggregateError,
  rethrowAsync,
  catchAsync,
} from '../api';
import { isError } from 'util';
import { basename } from 'path';

export interface ICheckoutProps {
  vault?: string;
  files: string[];
  force?: boolean;
  verbosity?: number;
}

async function processFile(
  props: ICheckoutProps,
  file: string,
  items: IItem[],
  deps = {
    getDocument,
  }
) {
  const title = basename(file);
  const filtered = items.filter((item) => title === item?.overview?.title);

  if (filtered.length === 0) {
    throw new Error(`No document with title '${file}' found`);
  }

  if (filtered.length > 1) {
    throw new Error(`More than one document with title '${file}' found`);
  }

  const verbosity = props?.verbosity ?? 0;

  return await rethrowAsync(
    () =>
      deps.getDocument({
        verbosity,
        uuid: filtered[0].uuid,
        outputFilePath: file,
        ...(props.vault && { vault: props.vault }),
        ...(typeof props.force === 'boolean' && { force: props.force }),
      }),
    (errInfo) =>
      errInfo.withMessage('Cannot download document from 1-Password vault')
  );
}

export async function vaultCheckout(
  props: ICheckoutProps,
  /**
   * @ignore
   */
  deps = {
    listItems,
    getDocument,
  }
) {
  // tslint:disable-next-line: strict-boolean-expressions
  if (!props || typeof props !== 'object') {
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
      throw new AggregateError(first, ...rest);
    } else {
      throw errorResults[0];
    }
  }
}
