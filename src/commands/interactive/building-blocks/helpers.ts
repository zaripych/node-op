import { IAction, ActionCreator, ActionOf } from './types';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export function isOfType<T extends ActionCreator>(
  action: IAction,
  type: T
): action is ActionOf<T> {
  return action.type === type;
}

export function ofType<T extends ActionCreator>(type: T) {
  return (observable: Observable<IAction>) =>
    observable.pipe(filter(action => action.type === type)) as Observable<
      ActionOf<T>
    >;
}

export function isTruthy<T>(
  value: T | undefined | null | false | '' | 0
): value is NonNullable<T> {
  // tslint:disable-next-line: strict-boolean-expressions
  return !!value;
}
