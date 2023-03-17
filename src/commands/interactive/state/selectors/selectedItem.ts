import { map } from 'rxjs/operators';

import { setSelectedItem } from '../../actions';
import { ofType,sharedState } from '../../building-blocks';

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
