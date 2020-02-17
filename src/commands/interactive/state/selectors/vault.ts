import { map } from 'rxjs/operators';
import { sharedState, ofType } from '../../building-blocks';
import { setVault } from '../../actions';

export const vault = sharedState(
  actions =>
    actions.pipe(
      ofType(setVault),
      map(action => action.vault)
    ),
  {
    initial: undefined,
  }
);
