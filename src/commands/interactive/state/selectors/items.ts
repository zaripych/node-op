import { from, merge,of } from 'rxjs';
import { catchError,map, switchMap, withLatestFrom } from 'rxjs/operators';

import { listItems } from '../../../../api';
import { loadItems, loadItemsFailed,loadItemsSuccess } from '../../actions';
import type { Epic} from '../../building-blocks';
import {ofType, runEpic, sharedState } from '../../building-blocks';
import type { IRequest, IUiItem} from '../types';
import {mapItems } from '../types';
import { vault } from './vault';

const loadItemsEpic: Epic = (actions) =>
  actions.pipe(
    ofType(loadItems),
    withLatestFrom(vault),
    switchMap(([_, currentVault]) =>
      from(
        listItems({
          vault: currentVault,
          verbosity: 0,
        })
      ).pipe(
        map((next) => loadItemsSuccess(mapItems(next))),
        catchError((err) => of(loadItemsFailed(err)))
      )
    )
  );

runEpic(loadItemsEpic);

export const itemsRequest = sharedState<IRequest<IUiItem[]>>(
  (actions) =>
    merge(
      actions.pipe(ofType(loadItems)),
      actions.pipe(ofType(loadItemsSuccess)),
      actions.pipe(ofType(loadItemsFailed))
    ),
  {
    initial: { status: 'initial' },
  }
);

export const items = sharedState(
  (actions) =>
    actions.pipe(
      ofType(loadItemsSuccess),
      map((action) => action.data)
    ),
  {
    initial: [],
  }
);
