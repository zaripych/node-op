import { ensureError } from './ensureError';
import { AggregateError } from './aggregateError';
import { IRethrowInfo } from './types';

type Fn<O> = (() => Promise<O>) | (() => O);

function safeCall<O>(fn: Fn<O>) {
  try {
    return Promise.resolve(fn());
  } catch (exc) {
    return Promise.reject(exc);
  }
}

/**
 * Provides way to give errors that are thrown by external dependencies a
 * standard and possibly more meaningful message.
 *
 * @param future Function that can throw asynchronously or synchronously
 * @param message Message to assign to error, if thrown
 */
export async function rethrowAsync<O>(
  future: Fn<O>,
  throwError: (info: IRethrowInfo) => Error | never
) {
  try {
    return await safeCall(future);
  } catch (err) {
    const error = ensureError(err);
    const newError = throwError({
      rethrow: () => new AggregateError(error.message, error),
      withMessage: (msg) => new AggregateError(msg, error),
      thrown: error,
      // tslint:disable-next-line:strict-string-expressions
      toString: () => `${error}`,
    }) as Error | undefined;
    if (newError) {
      throw newError;
    }
    // istanbul-ignore-next
    throw error;
  }
}
