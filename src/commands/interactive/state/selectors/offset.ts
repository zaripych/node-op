import { map } from 'rxjs/operators';
import { sharedState, ofType } from '../../building-blocks';
import { setOffset } from '../../actions';

export const offset = sharedState(
  actions =>
    actions.pipe(
      ofType(setOffset),
      map(action => action.offset)
    ),
  {
    initial: 0,
  }
);
