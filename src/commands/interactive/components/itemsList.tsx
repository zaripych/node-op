import React from 'react';
import { Box, Color } from 'ink';
import { Highlight } from './highlight';
import { IUiItem, appState } from '../state';
import { useSelect } from '../building-blocks';
import { map, switchMap, skip } from 'rxjs/operators';
import Spinner from 'ink-spinner';
import { of, concat, timer } from 'rxjs';

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
        <Color green>
          <Spinner type={'dots'} />
        </Color>
      )}
      {status === 'failed' && <Color red>✗</Color>}
      {status === 'success' && <Color green>✓</Color>}
    </React.Fragment>
  );
};

export const ItemRow = (props: { item: IUiItem; highlight: string }) => {
  const { item, highlight } = props;

  return (
    <Box flexDirection="row" flexShrink={0}>
      <Box width={2} textWrap="truncate-end">
        <ItemStatus item={props.item} />
      </Box>
      <Box marginLeft={0} width={30} textWrap="truncate-end">
        <Highlight text={item.title || ''} substring={highlight} />
      </Box>
      <Box marginLeft={2} width={10} textWrap="truncate-end">
        {item.type}
      </Box>
      <Box marginLeft={2} width={30} textWrap="truncate-end">
        <Highlight text={item.description || ''} substring={highlight} />
      </Box>
      <Box marginLeft={2} width={30} textWrap="truncate-end">
        <Highlight text={item.urlHost || ''} substring={highlight} />
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
