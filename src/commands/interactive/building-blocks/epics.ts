import { asyncScheduler } from 'rxjs';
import { finalize, observeOn } from 'rxjs/operators';
import { tag } from 'rxjs-spy/operators';

import { actions,sharedSubscriptions } from './details';
import type { Epic,IAction } from './types';

export function runEpic<T extends IAction>(epic: Epic<T>) {
  if (sharedSubscriptions.has(epic)) {
    return;
  }

  sharedSubscriptions.set(
    epic,
    epic(actions.asObservable())
      .pipe(
        finalize(() => {
          const subscription = sharedSubscriptions.get(epic);
          if (!subscription) {
            return;
          }

          subscription.unsubscribe();
          sharedSubscriptions.delete(epic);
        }),
        observeOn(asyncScheduler),
        tag(epic.name || 'unknownEpic')
      )
      .subscribe({
        next: (result) => {
          actions.next(result);
        },
      })
  );
}
