import { Observable, BehaviorSubject, asyncScheduler } from 'rxjs';
import {
  distinctUntilChanged,
  multicast,
  shareReplay,
  finalize,
  startWith,
  observeOn,
} from 'rxjs/operators';
import { sharedSubscriptions, actions, sharedSelects } from './details';
import { Selector } from './types';

export function computeStateInBackground<T>(state: Observable<T>) {
  if (sharedSubscriptions.has(state)) {
    return false;
  }

  sharedSubscriptions.set(
    state,
    state.subscribe({
      next: () => {
        return;
      },
    })
  );

  return true;
}

export function createStateWithInitial<T>(
  selector: Selector<T>,
  initial: T,
  deps = { actions: actions.asObservable(), sharedSubscriptions }
) {
  const subject = new BehaviorSubject<T>(initial);

  const observable = multicast(() => subject)(
    selector(deps.actions).pipe(startWith(initial), distinctUntilChanged())
  );

  // if we want to unsubscribe from the actions
  // then in the selector we should takeUntil or take
  deps.sharedSubscriptions.set(subject, observable.connect());

  return subject;
}

export function createState<T>(
  selector: Selector<T>,
  deps = { actions: actions.asObservable(), sharedSubscriptions }
) {
  const observable = selector(deps.actions).pipe(
    distinctUntilChanged(),
    shareReplay({
      refCount: true,
      bufferSize: 1,
    })
  );

  // if we want to unsubscribe from the actions
  // then in the selector we should takeUntil or take
  deps.sharedSubscriptions.set(
    observable,
    observable.subscribe({
      next: () => {
        return;
      },
    })
  );

  return observable;
}

export function sharedState<T>(selector: Selector<T>): Observable<T>;
export function sharedState<T>(
  selector: Selector<T>,
  opts: { initial: T }
): BehaviorSubject<T>;
export function sharedState<T>(
  selector: Selector<T>,
  opts?: {
    initial?: T;
  },
  deps = {
    actions: actions.asObservable(),
    sharedSelects,
    sharedSubscriptions,
  }
) {
  const finalizingSelector: Selector<T> = a =>
    selector(a).pipe(
      finalize(() => {
        const instance = deps.sharedSelects.get(selector);
        if (!instance) {
          return;
        }
        deps.sharedSelects.delete(selector);

        const subscription = deps.sharedSubscriptions.get(instance);
        if (!subscription) {
          return;
        }

        subscription.unsubscribe();
        deps.sharedSubscriptions.delete(instance);
      }),
      observeOn(asyncScheduler)
    );

  const create = () => {
    if (opts && 'initial' in opts) {
      return createStateWithInitial(finalizingSelector, opts.initial as T, {
        actions: deps.actions,
        sharedSubscriptions: deps.sharedSubscriptions,
      });
    } else {
      return createState(finalizingSelector, {
        actions: deps.actions,
        sharedSubscriptions: deps.sharedSubscriptions,
      });
    }
  };

  const observable =
    (deps.sharedSelects.get(selector) as
      | BehaviorSubject<T>
      | Observable<T>
      | undefined) ?? create();

  if (!deps.sharedSelects.has(selector)) {
    deps.sharedSelects.set(selector, observable);
  }

  return observable;
}
