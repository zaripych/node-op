import type { Subscription } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { tag } from 'rxjs-spy/operators';

import { actions, observableActions, sharedSubscriptions } from './details';
import { shutdownActions } from './shutdown';
import type { Action, Epic } from './types';

export function runEpic<T extends Action>(
  epic: Epic<T>,
  opts: { name?: string; silent?: boolean } = {}
) {
  if (sharedSubscriptions.has(epic)) {
    return sharedSubscriptions.get(epic) as Subscription;
  }

  const subscription = epic(observableActions)
    .pipe(
      takeUntil(shutdownActions),
      finalize(() => {
        const subscription = sharedSubscriptions.get(epic);
        if (!subscription) {
          return;
        }

        subscription.unsubscribe();
        sharedSubscriptions.delete(epic);
      }),
      opts.silent ? (x) => x : tag(opts.name || epic.name || 'unknownEpic')
    )
    .subscribe({
      next: (result) => {
        actions.next(result);
      },
    });

  sharedSubscriptions.set(epic, subscription);
  return subscription;
}
