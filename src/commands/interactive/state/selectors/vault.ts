import { map } from 'rxjs/operators';

import { setVault } from '../../actions';
import { ofType,sharedState } from '../../building-blocks';

export const vault = sharedState(
  (actions) =>
    actions.pipe(
      ofType(setVault),
      map((action) => action.vault)
    ),
  {
    initial: undefined,
  }
);
