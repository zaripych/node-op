import { combineLatest } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
} from 'rxjs/operators';

import { setItemsFilter } from '../../actions';
import { ofType,sharedState } from '../../building-blocks';
import { items } from './items';

export const filter = sharedState(
  (actions) =>
    actions.pipe(
      ofType(setItemsFilter),
      map((action) => action.filter)
    ),
  { initial: '' }
);

export const filteredItems = sharedState(
  (actions) =>
    combineLatest(
      actions.pipe(
        ofType(setItemsFilter),
        map((action) => action.filter.toLowerCase()),
        distinctUntilChanged(),
        debounceTime(50),
        startWith('')
      ),
      items
    ).pipe(
      map(([filterText, lastItems]) =>
        filterText
          ? lastItems.filter(
              (item) =>
                item.title.toLowerCase().includes(filterText) ||
                item.description?.includes(filterText) ||
                item.urlHost?.includes(filterText)
            )
          : lastItems
      )
    ),
  {
    initial: [],
  }
);
