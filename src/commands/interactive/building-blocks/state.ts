import type { Observable } from 'rxjs';
import { defer } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, share } from 'rxjs/operators';

import { observableActions } from './details';
import type { ActionsTransform } from './types';

export function sharedState<T>(
  selector: ActionsTransform<T>,
  opts: { initial: T },
  deps = { actions: observableActions }
) {
  const subject: BehaviorSubject<T> = new BehaviorSubject(opts.initial);

  const observable = defer(() => selector(deps.actions)).pipe(
    distinctUntilChanged(),
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
