import { ensureError } from './ensureError';
import type { OptionalResult } from './types';

type Fn<O> = (() => Promise<O>) | (() => O);

function safeCall<O>(fn: Fn<O>) {
  try {
    return Promise.resolve(fn());
  } catch (exc) {
    return Promise.reject(exc);
  }
}

export const catchAsync = async <O>(
  fn: Fn<O>,
  opts: {
    errorMessage?: string;
  } = {}
): Promise<OptionalResult<O>> => {
  try {
    const result = await safeCall(fn);
    return {
      error: null,
      result,
    };
  } catch (err) {
    return {
      error: opts.errorMessage
        ? new Error(opts.errorMessage, { cause: ensureError(err) })
        : ensureError(err),
      result: null,
    };
  }
};

type SyncFn<O> = () => O;

export const catchSync = <O>(fn: SyncFn<O>): OptionalResult<O> => {
  try {
    return {
      error: null,
      result: fn(),
    };
  } catch (err) {
    return {
      error: ensureError(err),
      result: null,
    };
  }
};
