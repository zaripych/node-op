import React from 'react';
import type { Observable } from 'rxjs';
import { isObservable } from 'rxjs';

import type { AnyParams } from './bivariantFn';
import { sharedState } from './state';
import type { Action } from './types';

const defaultDeps = {
  useMemo: React.useMemo,
  useState: React.useState,
  useEffect: React.useEffect,
}

export function useSelect<T>(sharedState: Observable<T> & { readonly value: T }): [
  T,
  Observable<T> & { readonly value: T }
];
export function useSelect<const Args extends AnyParams, T>(
  select: (...args: [...Args, Observable<Action>]) => Observable<T>,
  args: Args,
): [T | undefined, Observable<T>];
export function useSelect<const Args extends AnyParams, T>(
  select: (...args: [...Args, Observable<Action>]) => Observable<T>,
  args: Args,
  initial: T,
  deps?: typeof defaultDeps
): [T, Observable<T>];
export function useSelect<Args extends AnyParams, T>(
  arg_0:
    | Observable<T>
    | ((...args: [...Args, Observable<Action>]) => Observable<T>),
  arg_1?: Args,
  arg_2?: T,
  deps = defaultDeps
) {
  const select = typeof arg_0 === 'function' ? arg_0 : undefined;
  const sharedSource = isObservable(arg_0) ? arg_0 : undefined;
  const sharedSourceOrSelect = sharedSource ?? select;
  const initial = sharedSource && 'value' in sharedSource ? sharedSource.value : arg_2;
  const reactDeps = Array.isArray(arg_1) ? arg_1 : ([] as unknown as Args);

  if (!sharedSourceOrSelect) {
    throw new Error('Either source or selector must be provided');
  }

  const [state, setState] = deps.useState(initial);

  const observable = deps.useMemo(
    () =>
      typeof sharedSourceOrSelect === 'function'
        ? sharedState(
            (actions) => sharedSourceOrSelect(...[...reactDeps, actions]),
            {
              initial,
            }
          )
        : sharedSourceOrSelect,
    reactDeps
  );

  deps.useEffect(() => {
    const subscription = observable.subscribe({
      next: (result) => {
        setState(result);
      },
    });
    return () => subscription.unsubscribe();
  }, [setState, observable]);

  return [state, observable] as const;
}
useSelect.defaultDeps = defaultDeps;
