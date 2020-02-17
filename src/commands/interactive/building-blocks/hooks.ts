import React from 'react';
import { IAction, Selector, ActionCreator } from './types';
import { actions } from './details';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { sharedState } from './state';
import { ofType } from './helpers';
import {
  switchMap,
  map,
  withLatestFrom,
  distinctUntilChanged,
  startWith,
} from 'rxjs/operators';

export const useActionBinding = <P extends unknown[]>(
  bindCb: (...args: P) => Observable<IAction>,
  deps: React.DependencyList = []
) => {
  const callback = useActionTrigger<P>(
    triggers => triggers.pipe(switchMap(args => bindCb(...args))),
    deps
  );
  return React.useCallback((...args: P) => callback(args), [callback]);
};

export const useStateActionBinding = <T>(
  state: Observable<T>,
  bindCb: (value: T) => Observable<IAction>,
  deps: React.DependencyList = []
) => {
  return useActionTrigger<React.SetStateAction<T>>(
    triggers =>
      triggers.pipe(
        withLatestFrom(state),
        switchMap(([setStateAction, value]) => {
          if (typeof setStateAction === 'function') {
            const fn = setStateAction as (value: T) => T;
            return bindCb(fn(value));
          } else {
            return bindCb(setStateAction);
          }
        })
      ),
    deps.includes(state) ? deps : [...deps, state]
  );
};

export const useStateWithActions = <T>(initial: T) => {
  const setStateAction: ActionCreator<IAction & {
    next: T;
  }> = React.useCallback(
    (next: T) => ({
      type: setStateAction,
      next,
    }),
    []
  );

  const [state, observable] = useSelect<T>(
    source =>
      source.pipe(
        ofType(setStateAction),
        map(action => action.next)
      ),
    {
      initial,
      deps: [setStateAction],
    }
  );

  const setState = useStateActionBinding(
    observable,
    next => of(setStateAction(next)),
    [setStateAction]
  );

  return [state, setState, observable] as const;
};

export const useActionTrigger = <P>(
  project: (
    triggers: Observable<P>,
    actions: Observable<IAction>
  ) => Observable<IAction>,
  deps: React.DependencyList = []
): ((arg: P) => void) => {
  const actionTrigger: ActionCreator<IAction & {
    parameter: P;
  }> = React.useCallback(
    (parameter: P) => ({
      type: actionTrigger,
      parameter,
    }),
    []
  );

  useEpicWhenMounted(
    incoming =>
      project(
        incoming.pipe(
          ofType(actionTrigger),
          map(item => item.parameter)
        ),
        incoming
      ),
    [...deps, actionTrigger]
  );

  const callback: (arg: P) => void = React.useCallback(parameter => {
    actions.next(actionTrigger(parameter));
  }, []);

  return callback;
};

export function useSelect<T>(
  selector: BehaviorSubject<T>,
  deps?: React.DependencyList
): [T, BehaviorSubject<T>];
export function useSelect<T>(
  selector: Observable<T> | Selector<T>,
  deps?: React.DependencyList
): [T | undefined, Observable<T>];
export function useSelect<T>(
  selector: Observable<T> | Selector<T>,
  opts: {
    initial: T;
    deps?: React.DependencyList;
  }
): [T, Observable<T>];
export function useSelect<T>(
  selector: BehaviorSubject<T> | Observable<T> | Selector<T>,
  opts?:
    | React.DependencyList
    | {
        initial?: T;
        deps?: React.DependencyList;
      }
) {
  const needsInitial = opts && 'initial' in opts;
  const computedInitial =
    'value' in selector
      ? selector.value
      : opts && 'initial' in opts
      ? opts?.initial
      : undefined;
  const computedDeps = (Array.isArray(opts)
    ? opts
    : opts && 'deps' in opts
    ? opts?.deps
    : undefined) ?? [selector];
  const [state, setState] = React.useState(computedInitial);

  const observable = React.useMemo(
    () =>
      typeof selector === 'function'
        ? needsInitial
          ? sharedState(selector, { initial: computedInitial })
          : sharedState(selector)
        : selector.pipe(
            stream =>
              needsInitial ? stream.pipe(startWith(computedInitial)) : stream,
            distinctUntilChanged()
          ),
    computedDeps
  );

  React.useEffect(() => {
    const subscription = observable.subscribe({
      next: result => {
        setState(result);
      },
    });
    return () => subscription.unsubscribe();
  }, [setState, observable]);

  return [state, observable] as const;
}

export const useEpicWhenMounted = (
  epic: (actions: Observable<IAction>) => Observable<IAction>,
  deps: React.DependencyList = []
) => {
  React.useEffect(() => {
    const subscription = epic(actions.asObservable()).subscribe({
      next: action => {
        actions.next(action);
      },
    });
    return () => subscription.unsubscribe();
  }, [actions, ...deps]);
};

export const dispatch = (action: IAction) => {
  actions.next(action);
};
