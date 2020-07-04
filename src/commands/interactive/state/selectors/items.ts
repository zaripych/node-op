import { from, of, merge } from 'rxjs';
import { switchMap, withLatestFrom, map, catchError } from 'rxjs/operators';
import { mapItems, IRequest, IUiItem } from '../types';
import { listItems } from '../../../../api';
import { loadItems, loadItemsSuccess, loadItemsFailed } from '../../actions';
import { runEpic, sharedState, ofType, Epic } from '../../building-blocks';
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
