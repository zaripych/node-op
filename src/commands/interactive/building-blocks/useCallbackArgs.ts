import React from 'react';
import type { Observable } from 'rxjs';
import { defer } from 'rxjs';
import { concat } from 'rxjs';
import { Subject } from 'rxjs';

import type { Action } from './types';
import { useComponentName } from './useComponentName';
import { useEpic } from './useEpic';

type UseCallbackArgs = {
  <P extends unknown[]>(
    fn: (
      args: P extends []
        ? Observable<void>
        : P extends [infer Single]
        ? Observable<Single>
        : Observable<P>,
      actions: Observable<Action>
    ) => Observable<Action>
  ): (...args: P) => void;
};

const transform = <P extends unknown[]>(...args: P) => {
  if (args.length === 0) {
    return undefined;
  }
  if (args.length === 1) {
    return args[0];
  }
  return args;
};

export const useCallbackArgs: UseCallbackArgs = (<P extends unknown[]>(
  fn: (args: Observable<P>, actions: Observable<Action>) => Observable<Action>
): ((...args: P) => void) => {
  const name = useComponentName('useCallbackArgs');
  const argsObservable = React.useMemo(() => new Subject<unknown>(), []);
  const bufferRef = React.useRef<unknown[] | null>([]);

  useEpic(
    (actions) =>
      fn(
        concat(
          // re-emit from buffer
          defer(() => {
            const bufferValue = bufferRef.current;
            bufferRef.current = null;
            return bufferValue === null ? [] : bufferValue;
          }),
          argsObservable
        ) as Observable<P>,
        actions
      ),
    [argsObservable],
    { name }
  );

  const callback: (...args: P) => void = React.useCallback((...args) => {
    const value = transform(...args);
    // collect into the buffer until we are subscribed to the epic
    if (bufferRef.current !== null) {
      bufferRef.current.push(value);
    }
    argsObservable.next(value);
  }, []);
  return callback;
}) as UseCallbackArgs;
