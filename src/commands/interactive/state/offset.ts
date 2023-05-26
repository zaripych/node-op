import { map } from 'rxjs/operators';

import { setOffset } from '../actions';
import { ofType, sharedState } from '../building-blocks';

export const offset = sharedState(
  (actions) =>
    actions.pipe(
      ofType(setOffset),
      map((action) => action.offset)
    ),
  {
    initial: 0,
  }
);
