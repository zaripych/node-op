import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import React from 'react';
import { concat, of, timer } from 'rxjs';
import { map, skip,switchMap } from 'rxjs/operators';

import { useSelect } from '../building-blocks';
import type {IUiItem } from '../state';
import { appState } from '../state';
import { Highlight } from './highlight';

interface IProps {
  items: IUiItem[];
  highlight: string;
}

export const ItemStatus = (props: { item: IUiItem }) => {
  const [status] = useSelect(
    appState.itemDetailsRequest.pipe(
      skip(1),
      map(
        (request) =>
          ('uuid' in request &&
            request.uuid === props.item.uuid &&
            request.status) ||
          ('not-this-item' as const)
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
    ),
    {
      deps: [appState.itemDetailsRequest, props.item.uuid],
      initial: 'not-this-item' as const,
    }
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

export const ItemRow = (props: { item: IUiItem; highlight: string }) => {
  const { item, highlight } = props;

  return (
    <Box flexDirection="row" flexShrink={0}>
      <Box width={2}>
        <ItemStatus item={props.item} />
      </Box>
      <Box marginLeft={0} width={30}>
        <Text wrap="truncate-end">
          <Highlight text={item.title || ''} substring={highlight} />
        </Text>
      </Box>
      <Box marginLeft={2} width={10}>
        <Text wrap="truncate-end">{item.type}</Text>
      </Box>
      <Box marginLeft={2} width={30}>
        <Text wrap="truncate-end">
          <Highlight text={item.description || ''} substring={highlight} />
        </Text>
      </Box>
      <Box marginLeft={2} width={30}>
        <Text wrap="truncate-end">
          <Highlight text={item.urlHost || ''} substring={highlight} />
        </Text>
      </Box>
    </Box>
  );
};

export const ItemsList: React.FC<IProps> = (props) => {
  return (
    <React.Fragment>
      {props.items.map((item) => (
        <ItemRow key={item.uuid} item={item} highlight={props.highlight} />
      ))}
    </React.Fragment>
  );
};
