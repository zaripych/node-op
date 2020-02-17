import { from, of, merge } from 'rxjs';
import { switchMap, withLatestFrom, map, catchError } from 'rxjs/operators';
import { mapItemDetails } from '../types';
import { getItem } from '../../../../api';
import {
  loadItemDetails,
  loadItemDetailsFailed,
  loadItemDetailsSuccess,
  loadItemDetailsReset,
} from '../../actions';
import { runEpic, sharedState, ofType, Epic } from '../../building-blocks';
import { vault } from './vault';

const loadItemDetailsEpic: Epic = actions =>
  actions.pipe(
    ofType(loadItemDetails),
    withLatestFrom(vault),
    switchMap(([action, currentVault]) =>
      from(
        getItem({
          uuid: action.uuid,
          vault: currentVault,
          verbosity: 0,
        })
      ).pipe(
        map(details =>
          loadItemDetailsSuccess(action.uuid, mapItemDetails(details))
        ),
        catchError(err => of(loadItemDetailsFailed(action.uuid, err)))
      )
    )
  );

runEpic(loadItemDetailsEpic);

export const itemDetailsRequest = sharedState(
  actions =>
    merge(
      actions.pipe(ofType(loadItemDetailsReset)),
      actions.pipe(ofType(loadItemDetails)),
      actions.pipe(ofType(loadItemDetailsSuccess)),
      actions.pipe(ofType(loadItemDetailsFailed))
    ),
  {
    initial: loadItemDetailsReset(),
  }
);

export const itemDetails = sharedState(
  actions =>
    actions.pipe(
      ofType(loadItemDetailsSuccess),
      map(action => action.data)
    ),
  {
    initial: undefined,
  }
);
