import { map } from 'rxjs/operators';
import { sharedState, ofType } from '../../building-blocks';
import { setSelectedItem } from '../../actions';

export const selectedItem = sharedState(
  (actions) =>
    actions.pipe(
      ofType(setSelectedItem),
      map((action) => action.item)
    ),
  {
    initial: undefined,
  }
);
