import React from 'react';
import { defer, EMPTY, merge, of } from 'rxjs';
import {
  filter,
  ignoreElements,
  map,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import {
  keyInput,
  loadItemDetails,
  loadItemDetailsFailed,
  loadItemDetailsSuccess,
  navigateToItemDetails,
  setItemsFilter,
  setOffset as rememberOffset,
  setSelectedIndex,
  setSelectedItem,
} from '../../actions';
import { ofType, useEpic, useSelect } from '../../building-blocks';
import { useCallbackArgs } from '../../building-blocks/useCallbackArgs';
import { useAppInput } from '../../hooks';
import { appState } from '../../state';
import type { OnLayout } from '../scrollView';

function useLoadItemDetailsOnEnter() {
  useEpic((actions) =>
    actions.pipe(
      ofType(keyInput),
      filter((action) => action.key.return),
      withLatestFrom(appState.itemDetails, appState.selectedItem),
      switchMap(([_, details, selected]) => {
        if (!selected) {
          return EMPTY;
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
    )
  );
}

function useTextInputToModifyFilterText() {
  useEpic((actions) =>
    actions.pipe(
      ofType(keyInput),
      withLatestFrom(appState.filter),
      switchMap(([action, current]) => {
        if (
          (action.key.ctrl || action.key.meta) &&
          (action.key.delete || action.key.backspace)
        ) {
          return current.length > 0 ? of(setItemsFilter('')) : EMPTY;
        } else if (action.key.delete || action.key.backspace) {
          return current.length > 0
            ? of(setItemsFilter(current.substring(0, current.length - 1)))
            : EMPTY;
        } else {
          const index = action.input.search(/\n|\r/);
          const input =
            index === -1 ? action.input : action.input.substring(0, index);
          return action.key.meta ? EMPTY : of(setItemsFilter(current + input));
        }
      })
    )
  );
}

export function useInputAndLayoutChangesToControlScrollView() {
  const onLayout: OnLayout = useCallbackArgs((layoutUpdated, actions) =>
    merge(
      layoutUpdated.pipe(map((layout) => rememberOffset(layout.offset))),
      actions.pipe(
        ofType(keyInput),
        withLatestFrom(layoutUpdated, appState.selectedItemIndex),
        switchMap(
          ([
            input,
            { viewportHeight, contentHeight, offset, maxOffset, setOffset },
            selectedIndex,
          ]) => {
            if (input.key.pageUp) {
              return merge(
                defer(() => {
                  setOffset(offset - viewportHeight);
                  return EMPTY;
                }),
                of(setSelectedIndex(0))
              );
            } else if (input.key.pageDown) {
              return merge(
                defer(() => {
                  setOffset(offset + viewportHeight);
                  return EMPTY;
                }),
                defer(() =>
                  offset === maxOffset
                    ? [setSelectedIndex(contentHeight - 1)]
                    : EMPTY
                )
              );
            } else if (input.key.upArrow) {
              return of(setSelectedIndex(selectedIndex - 1));
            } else if (input.key.downArrow) {
              return of(setSelectedIndex(selectedIndex + 1));
            }
            return EMPTY;
          }
        )
      ),
      appState.selectedItemIndex.pipe(
        withLatestFrom(layoutUpdated),
        switchMap(([selectedIndex, { viewportHeight, offset, setOffset }]) => {
          if (
            selectedIndex > offset + viewportHeight - 1 &&
            selectedIndex < offset + viewportHeight + 5
          ) {
            setOffset(offset + 5);
          }
          if (selectedIndex < offset && selectedIndex > offset - 5) {
            setOffset(offset - 5);
          }
          return EMPTY;
        })
      ),
      layoutUpdated.pipe(
        withLatestFrom(appState.selectedItemOffset),
        switchMap(([{ viewportHeight, offset }, selectedOffset]) => {
          if (selectedOffset === undefined) {
            return EMPTY;
          }
          if (selectedOffset > offset + viewportHeight) {
            return of(setSelectedIndex(offset));
          } else if (selectedOffset < offset) {
            return of(setSelectedIndex(offset));
          }
          return EMPTY;
        })
      )
    )
  );

  return { onLayout };
}

export function useSearchItemsState() {
  const [items] = useSelect(appState.items);
  const [filteredItems] = useSelect(appState.filteredItems);
  const [filterText] = useSelect(appState.filter);

  const [itemDetailsRequest] = useSelect(appState.itemDetailsRequest);
  const { isRawModeSupported } = useAppInput();

  useTextInputToModifyFilterText();
  useLoadItemDetailsOnEnter();

  const initialOffsetRef = React.useRef<number>(appState.offset.value);
  useEpic(() =>
    appState.offset.pipe(
      tap((offset) => {
        initialOffsetRef.current = offset;
      }),
      ignoreElements()
    )
  );

  return {
    items,
    filterText,
    filteredItems,
    itemDetailsRequest,
    isRawModeSupported,
    initialOffset: initialOffsetRef.current,
    ...useInputAndLayoutChangesToControlScrollView(),
  };
}
