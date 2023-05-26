import { combineLatest, EMPTY, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter as filterOp,
  map,
  startWith,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';

import { setItemsFilter, setSelectedIndex, setSelectedItem } from '../actions';
import type { Epic } from '../building-blocks';
import { isTruthy, ofType, runEpic, sharedState } from '../building-blocks';
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
    combineLatest([
      actions.pipe(
        ofType(setItemsFilter),
        map((action) => action.filter.toLowerCase()),
        distinctUntilChanged(),
        debounceTime(50),
        startWith('')
      ),
      items,
    ]).pipe(
      map(([filterText, lastItems]) =>
        filterText
          ? lastItems.filter(
              (item) =>
                item.title.toLowerCase().includes(filterText) ||
                item.description?.toLowerCase().includes(filterText) ||
                item.urlHost?.toLowerCase().includes(filterText)
            )
          : lastItems
      )
    ),
  {
    initial: [],
  }
);

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

export const selectedItemIndex = sharedState(
  () =>
    combineLatest([filteredItems, selectedItem]).pipe(
      map(([filteredItems, selectedItem]) =>
        !selectedItem ? 0 : Math.max(filteredItems.indexOf(selectedItem), 0)
      ),
      distinctUntilChanged()
    ),
  {
    initial: 0,
  }
);

const setSelectedItemOnSetSelectedIndex: Epic = (actions) =>
  actions.pipe(
    ofType(setSelectedIndex),
    withLatestFrom(filteredItems),
    map(([action, filteredItems]) => filteredItems[action.index]),
    filterOp(isTruthy),
    map((item) => setSelectedItem(item))
  );

runEpic(setSelectedItemOnSetSelectedIndex);

const resetSelectedItemOnFilteredItemsChange: Epic = () =>
  filteredItems.pipe(
    withLatestFrom(selectedItem),
    switchMap(([filteredItems, selectedItem]) =>
      filteredItems.length > 0 &&
      (!selectedItem || !filteredItems.includes(selectedItem))
        ? of(setSelectedItem(filteredItems[0]))
        : EMPTY
    )
  );

runEpic(resetSelectedItemOnFilteredItemsChange);
