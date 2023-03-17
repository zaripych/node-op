import type React from 'react';
import { empty, merge,of } from 'rxjs';
import {
  filter,
  map,
  switchMap,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators';

import {
  keyInput,
  loadItemDetails,
  loadItemDetailsFailed,
  loadItemDetailsSuccess,
  navigateToItemDetails,
  setItemsFilter,
  setOffset as setOffsetAction,
  setSelectedItem,
} from '../actions';
import {
  ofType,
  useActionTrigger,
  useEpicWhenMounted,
  useSelect,
  useStateActionBinding,
} from '../building-blocks';
import type { IUiItem } from '../state';
import { appState } from '../state';

function cursorFromSelectedItem(item: IUiItem | undefined, items: IUiItem[]) {
  if (!item) {
    return 0;
  }
  const index = items.indexOf(item);
  if (index === -1) {
    return 0;
  }
  return index;
}

function useLoadItemDetailsOnEnter() {
  useEpicWhenMounted(
    (actions) =>
      actions.pipe(
        ofType(keyInput),
        filter((action) => action.key.return),
        withLatestFrom(appState.itemDetails, appState.selectedItem),
        switchMap(([_, details, selected]) => {
          if (!selected) {
            return empty();
          }
          if (details && selected.uuid === details.uuid) {
            return of(navigateToItemDetails(details.uuid));
          }
          return merge(
            of(loadItemDetails(selected.uuid)),
            // navigate unless we moved on:
            actions.pipe(
              ofType(loadItemDetailsSuccess),
              map((item) => navigateToItemDetails(item.uuid)),
              takeUntil(
                merge(
                  actions.pipe(ofType(loadItemDetailsFailed)),
                  actions
                    .pipe(ofType(setSelectedItem))
                    .pipe(filter((item) => item.item !== selected))
                )
              )
            )
          );
        })
      ),
    [appState.itemDetails, appState.selectedItem]
  );
}

function useTextInputToModifyFilterText() {
  useEpicWhenMounted(
    (actions) =>
      actions.pipe(
        ofType(keyInput),
        withLatestFrom(appState.filter),
        switchMap(([action, previous]) => {
          if (action.key.ctrl && (action.key.delete || action.key.backspace)) {
            return previous.length > 0 ? of(setItemsFilter('')) : empty();
          } else if (action.key.delete || action.key.backspace) {
            return previous.length > 0
              ? of(setItemsFilter(previous.substring(0, previous.length - 1)))
              : empty();
          } else {
            const index = action.input.search(/\n|\r/);
            const input =
              index === -1 ? action.input : action.input.substr(0, index);
            return action.key.meta
              ? empty()
              : of(setItemsFilter(previous + input));
          }
        })
      ),
    [appState.filter]
  );
}

export function useSearchItems() {
  const [offset] = useSelect(appState.offset);

  const setOffset = useStateActionBinding(appState.offset, (next) =>
    of(setOffsetAction(next))
  );

  const [items] = useSelect(appState.items);
  const [filteredItems] = useSelect(appState.filteredItems);
  const [filterText] = useSelect(appState.filter);
  const [selectedItem] = useSelect(appState.selectedItem);

  const cursor = cursorFromSelectedItem(selectedItem, filteredItems);
  const setCursor = useActionTrigger<React.SetStateAction<number>>(
    (triggers) =>
      triggers.pipe(
        withLatestFrom(appState.selectedItem, appState.filteredItems),
        switchMap(([offsetOrCallback, item, currentFilteredItems]) => {
          const currentOffset = cursorFromSelectedItem(
            item,
            currentFilteredItems
          );
          const nextOffset =
            typeof offsetOrCallback === 'function'
              ? offsetOrCallback(currentOffset)
              : offsetOrCallback;
          if (nextOffset >= 0 && nextOffset < currentFilteredItems.length) {
            return of(setSelectedItem(currentFilteredItems[nextOffset]));
          } else {
            return of(setSelectedItem(undefined));
          }
        })
      ),
    [appState.selectedItem, appState.filteredItems]
  );

  const [itemDetailsRequest] = useSelect(appState.itemDetailsRequest);

  useTextInputToModifyFilterText();
  useLoadItemDetailsOnEnter();

  return {
    items,
    offset,
    setOffset,
    cursor,
    setCursor,
    filterText,
    filteredItems,
    itemDetailsRequest,
  };
}
