import type { DOMElement } from 'ink';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import React from 'react';
import { concat, NEVER, of, timer } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  skip,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';

import { setSelectedItemOffset } from '../actions';
import { useEpic, useSelect } from '../building-blocks';
import type { UiItem } from '../state';
import { appState } from '../state';
import { Highlight } from './highlight';

interface Props {
  items: UiItem[];
  highlight: string;
}

const itemDetailsRequestFor = (uuid: string) => {
  return appState.itemDetailsRequest.pipe(
    // ignore current state
    skip(1),
    map((request) =>
      'uuid' in request && request.uuid === uuid
        ? request.status
        : ('not-this-item' as const)
    ),
    switchMap((next) => {
      if (next === 'success' || next === 'failed') {
        return concat(
          of(next),
          timer(1000).pipe(map(() => 'not-this-item' as const))
        );
      }
      return of(next);
    })
  );
};

export const ItemCursor = (props: { item: UiItem }) => {
  const [status] = useSelect(
    (uuid) => itemDetailsRequestFor(uuid),
    [props.item.uuid],
    'not-this-item' as const
  );

  if (status === 'failed') {
    return <Text color="red">{'>'}</Text>;
  }
  return <Text color="green">{'>'}</Text>;
};

export const ItemStatus = (props: { item: UiItem }) => {
  const [status] = useSelect(
    (uuid) => itemDetailsRequestFor(uuid),
    [props.item.uuid],
    'not-this-item' as const
  );

  return (
    <React.Fragment>
      {status === 'started' && (
        <Text color="green">
          <Spinner type={'dots'} />
        </Text>
      )}
      {status === 'failed' && <Text color="red">✗</Text>}
      {status === 'success' && <Text color="green">✓</Text>}
    </React.Fragment>
  );
};

const usePublishItemOffset = (opts: { item: UiItem }) => {
  const { item } = opts;

  const ref = React.useRef<DOMElement>(null);

  useEpic(
    () =>
      appState.selectedItemIndex.pipe(
        withLatestFrom(appState.selectedItem),
        switchMap(([selectedItemIndex, selectedItem]) => {
          if (selectedItemIndex === -1) {
            return NEVER;
          }
          if (selectedItem?.uuid !== item.uuid) {
            return NEVER;
          }
          const layout = ref.current?.yogaNode?.getComputedLayout();
          if (!layout) {
            return NEVER;
          }
          return of(
            setSelectedItemOffset({
              uuid: item.uuid,
              offset: layout.top,
            })
          );
        }),
        distinctUntilChanged((a, b) => a.offset === b.offset)
      ),
    [item.uuid]
  );

  return { ref };
};

export const ItemRow = (props: {
  item: UiItem;
  highlight: string;
  order: 'even' | 'odd';
}) => {
  const { item, highlight, order } = props;

  const [selected] = useSelect(
    (item) =>
      appState.selectedItem.pipe(map((selectedItem) => selectedItem === item)),
    [item],
    false
  );

  const { ref } = usePublishItemOffset({ item });

  const rowStyle = React.useMemo(() => {
    if (order === 'even') {
      return {};
    } else {
      return {
        dimColor: true,
      };
    }
  }, [selected, order]);

  return (
    <Box flexDirection="row" flexShrink={0} ref={ref}>
      <Box width={2}>{selected && <ItemCursor item={props.item} />}</Box>
      <Box width={2}>
        <ItemStatus item={props.item} />
      </Box>
      <Box marginLeft={0} width={'30%'}>
        <Text wrap="truncate-end" {...rowStyle}>
          <Highlight text={item.title || ''} substring={highlight} />
        </Text>
      </Box>
      <Box marginLeft={2} width={'10%'}>
        <Text wrap="truncate-end" {...rowStyle}>
          {item.type}
        </Text>
      </Box>
      <Box marginLeft={2} width={'30%'}>
        <Text wrap="truncate-end" {...rowStyle}>
          <Highlight text={item.description || ''} substring={highlight} />
        </Text>
      </Box>
      <Box marginLeft={2} width={'20%'}>
        <Text wrap="truncate-end" {...rowStyle}>
          <Highlight text={item.urlHost || ''} substring={highlight} />
        </Text>
      </Box>
    </Box>
  );
};

export const ItemsList: React.FC<Props> = (props) => {
  return (
    <React.Fragment>
      {props.items.map((item, i) => (
        <ItemRow
          key={item.uuid}
          item={item}
          highlight={props.highlight}
          order={i % 2 ? 'even' : 'odd'}
        />
      ))}
    </React.Fragment>
  );
};
