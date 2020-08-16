import React from 'react';
import { Box, Text, BoxProps, DOMElement } from 'ink';
import { IUiItemDetailsFields, appState } from '../state';
import { useSelect } from '../building-blocks';
import { skip, map, switchMap } from 'rxjs/operators';
import { concat, of, timer } from 'rxjs';
import Spinner from 'ink-spinner';

interface IProps {
  titleColumnWidth: number;
  valueColumnWidth: number;
  field: IUiItemDetailsFields;
  forwardRef?: (box: DOMElement | null) => void;
}

export const ItemField: React.FC<IProps> = (props) => {
  const newLineIndex = props.field.value.indexOf('\n');
  const firstLine =
    newLineIndex !== -1
      ? props.field.value.substring(
          0,
          Math.min(newLineIndex - 1, props.valueColumnWidth)
        ) + '⏎'
      : props.field.value.substring(
          0,
          Math.min(props.field.value.length, props.valueColumnWidth)
        );
  return (
    <Box flexDirection="row" ref={props.forwardRef}>
      <Box width={props.titleColumnWidth}>
        <Text color="gray">{props.field.title}</Text>
      </Box>
      <Box marginLeft={1} height={1}>
        <Text color="green" wrap="truncate">
          {props.field.concealed
            ? '*'.repeat(Math.min(5, Math.max(3, props.field.value.length)))
            : firstLine}
        </Text>
      </Box>
    </Box>
  );
};

export const FieldStatus = (
  props: BoxProps & { field: IUiItemDetailsFields }
) => {
  const [status] = useSelect(
    appState.copyToClipboardRequest.pipe(
      skip(1),
      map(
        (request) =>
          ('field' in request &&
            request.field === props.field &&
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
      deps: [appState.copyToClipboardRequest, props.field],
      initial: 'not-this-item' as const,
    }
  );

  const { field, ...rest } = props;

  return (
    <Box width={1} {...rest}>
      {status === 'started' && (
        <Text color="green">
          <Spinner type={'dots'} />
        </Text>
      )}
      {status === 'failed' && <Text color="red">✗</Text>}
      {status === 'success' && <Text color="green">✓</Text>}
    </Box>
  );
};
