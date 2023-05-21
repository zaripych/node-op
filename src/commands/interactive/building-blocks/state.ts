import type { Observable } from 'rxjs';
import { asyncScheduler } from 'rxjs';
import { defer } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, observeOn, share } from 'rxjs/operators';

import { actions } from './details';
import type { ActionsTransform } from './types';

export function sharedState<T>(
  selector: ActionsTransform<T>,
  opts: { initial: T },
  deps = { actions: actions.asObservable() }
) {
  const subject: BehaviorSubject<T> = new BehaviorSubject(opts.initial);

  const observable = defer(() => selector(deps.actions)).pipe(
    distinctUntilChanged(),
    observeOn(asyncScheduler),
    share({
      connector: () => subject,
      resetOnRefCountZero: true,
      resetOnComplete: false,
      resetOnError: false,
    })
  );

  return Object.defineProperty(observable, 'value', {
    get() {
      return subject.value;
    },
  }) as Observable<T> & { readonly value: T };
}
