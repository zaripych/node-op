import { merge, of, empty } from 'rxjs';
import { mapTo, withLatestFrom, switchMap } from 'rxjs/operators';
import { sharedState, ofType, runEpic, Epic } from '../../building-blocks';
import {
  navigateToLog,
  navigateToSearch,
  keyInput,
  navigateToItemDetails,
} from '../../actions';

export const screen = sharedState(
  actions =>
    merge(
      actions.pipe(ofType(navigateToLog), mapTo('log' as const)),
      actions.pipe(ofType(navigateToSearch), mapTo('search' as const)),
      actions.pipe(ofType(navigateToItemDetails), mapTo('itemDetails' as const))
    ),
  {
    initial: 'search' as const,
  }
);

const navigationEpic: Epic = actions =>
  actions.pipe(
    ofType(keyInput),
    withLatestFrom(screen),
    switchMap(([action, currentScreen]) => {
      if (action.key.ctrl && action.input === '^L') {
        return currentScreen !== 'log'
          ? of(navigateToLog())
          : of(navigateToSearch());
      } else if (
        (action.key.delete || action.key.backspace) &&
        currentScreen !== 'search'
      ) {
        return of(navigateToSearch());
      } else {
        return empty();
      }
    })
  );

runEpic(navigationEpic);
