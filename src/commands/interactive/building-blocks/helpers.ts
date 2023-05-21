import type { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

import type { Action, ActionCreator, ActionOf } from './types';

export function isOfType<T extends ActionCreator>(
  action: Action,
  type: T
): action is ActionOf<T> {
  return action.type === type;
}

export function ofType<T extends ActionCreator>(type: T) {
  return (observable: Observable<Action>) =>
    observable.pipe(filter((action) => action.type === type)) as Observable<
      ActionOf<T>
    >;
}

export function ofTypes<T extends ActionCreator[]>(...types: T) {
  return (observable: Observable<Action>) =>
    observable.pipe(
      filter((action) => types.some((type) => action.type === type))
    ) as Observable<ActionOf<T[number]>>;
}

export function isTruthy<T>(
  value: T | undefined | null | false | '' | 0
): value is NonNullable<T> {
  // tslint:disable-next-line: strict-boolean-expressions
  return !!value;
}
