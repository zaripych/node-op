import type { Observable } from 'rxjs';

import type { AnyParams, BivariantFn } from './bivariantFn';

export interface Action {
  type: ActionCreator;
}

export type ActionCreator<
  A extends Action = Action,
  P extends AnyParams = unknown[]
> = BivariantFn<P, A>;

export type ActionOf<T extends ActionCreator> = ReturnType<T> & {
  type: T;
};

export type ActionsTransform<
  T,
  Args extends [...AnyParams, Observable<Action>] = [Observable<Action>]
> = (...args: Args) => Observable<T>;

export type Epic<T extends Action = Action> = (
  actions: Observable<Action>
) => Observable<T>;
