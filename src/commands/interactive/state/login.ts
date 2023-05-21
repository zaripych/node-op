import { concat, from, merge, of } from 'rxjs';
import { catchError, delay, filter, map, switchMap } from 'rxjs/operators';

import { login } from '../../../api/login';
import {
  loadItems,
  loadItemsFailed,
  loginFailed,
  loginSuccess,
  tryLogin,
} from '../actions';
import type { Epic } from '../building-blocks';
import { sharedState } from '../building-blocks';
import { ofTypes } from '../building-blocks';
import { ofType, runEpic } from '../building-blocks';
import type { IRequest } from './types';

const loginEpic: Epic = (actions) =>
  actions.pipe(
    ofTypes(tryLogin),
    switchMap((params) =>
      from(
        login({
          shorthand: params.shorthand,
          verbosity: 1,
        })
      ).pipe(
        map(() => loginSuccess()),
        catchError((error) => of(loginFailed(error)))
      )
    )
  );

const tryLoginOnFailedItemsLoad: Epic = (actions) =>
  merge(
    actions.pipe(
      ofType(loadItemsFailed),
      filter((failure) =>
        failure.error.details.includes('You are not currently signed in')
      )
    ),
    actions.pipe(ofType(loginFailed), delay(500))
  ).pipe(
    switchMap(() =>
      concat(
        of(tryLogin()),
        actions.pipe(
          ofType(loginSuccess),
          map(() => loadItems())
        )
      )
    )
  );

runEpic(loginEpic);
runEpic(tryLoginOnFailedItemsLoad);

export const loginRequest = sharedState<IRequest<void>>(
  (actions) => actions.pipe(ofTypes(tryLogin, loginSuccess, loginFailed)),
  {
    initial: { status: 'initial' },
  }
);
