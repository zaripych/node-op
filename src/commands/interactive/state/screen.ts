import { EMPTY, merge, of } from 'rxjs';
import { map, switchMap, withLatestFrom } from 'rxjs/operators';

import {
  keyInput,
  navigateToItemDetails,
  navigateToLog,
  navigateToSearch,
} from '../actions';
import type { Epic } from '../building-blocks';
import { ofType, runEpic, sharedState } from '../building-blocks';

export const screen = sharedState(
  (actions) =>
    merge(
      actions.pipe(
        ofType(navigateToLog),
        map(() => 'log' as const)
      ),
      actions.pipe(
        ofType(navigateToSearch),
        map(() => 'search' as const)
      ),
      actions.pipe(
        ofType(navigateToItemDetails),
        map(() => 'itemDetails' as const)
      )
    ),
  {
    initial: 'search' as const,
  }
);

const navigationEpic: Epic = (actions) =>
  actions.pipe(
    ofType(keyInput),
    withLatestFrom(screen),
    switchMap(([action, currentScreen]) => {
      if (action.key.ctrl && action.input === 'l') {
        return currentScreen !== 'log'
          ? of(navigateToLog())
          : of(navigateToSearch());
      } else if (
        (action.key.delete || action.key.backspace) &&
        currentScreen !== 'search'
      ) {
        return of(navigateToSearch());
      } else {
        return EMPTY;
      }
    })
  );

runEpic(navigationEpic);
