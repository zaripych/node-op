import { Observable } from 'rxjs';

export interface IAction {
  type: ActionCreator;
}

export type ActionCreator<
  A extends IAction = IAction,
  P extends unknown[] = unknown[]
> = (...args: P) => A;

export type ActionOf<T extends ActionCreator> = ReturnType<T>;

export type Selector<T> = (actions: Observable<IAction>) => Observable<T>;

export type Epic<T extends IAction = IAction> = (
  actions: Observable<IAction>
) => Observable<T>;
