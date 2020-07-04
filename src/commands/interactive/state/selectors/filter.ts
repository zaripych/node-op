import { combineLatest } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  debounceTime,
  startWith,
} from 'rxjs/operators';
import { sharedState, ofType } from '../../building-blocks';
import { setItemsFilter } from '../../actions';
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
        debounceTime(250),
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
