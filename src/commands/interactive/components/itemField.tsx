import type { BoxProps } from 'ink';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import React from 'react';
import { concat, of, timer } from 'rxjs';
import { map, skip, switchMap } from 'rxjs/operators';

import { useSelect } from '../building-blocks';
import type { UiItemDetailsField, UiItemDetailsOtpField } from '../state';
import { appState } from '../state';

interface Props {
  field: UiItemDetailsField;
}

export const ItemField: React.FC<Props> = (props) => {
  return (
    <Box flexDirection="row">
      <Box>
        <Text color="gray">{props.field.title}</Text>
      </Box>
      <Box marginLeft={1} height={1} overflow="hidden">
        <Text color="green" wrap="truncate">
          {props.field.concealed
            ? '*'.repeat(Math.min(5, Math.max(3, props.field.value.length)))
            : props.field.value}
        </Text>
      </Box>
    </Box>
  );
};

interface OtpProps {
  title: string;
  otpField: UiItemDetailsOtpField;
}

const color = (pc: number) => {
  if (pc <= 0.15) {
    return 'red';
  }
  if (pc <= 0.5) {
    return 'yellow';
  }
  return 'green';
};

export const ItemOtpField: React.FC<OtpProps> = (props) => {
  const maxRef = React.useRef(props.otpField.expiresInSeconds);
  const max = maxRef.current;
  const pc = Math.max(0, Math.min(1, props.otpField.expiresInSeconds / max));
  return (
    <Box flexDirection="row">
      <Box>
        <Text color="gray">{props.title}</Text>
      </Box>
      <Box marginLeft={1} height={1} overflow="hidden">
        <Text color="green" wrap="truncate">
          {props.otpField.token}
        </Text>
        <Box marginLeft={1} marginRight={1}>
          <Text>-</Text>
        </Box>
        <Text>{'('}</Text>
        <Text color={color(pc)} wrap="truncate">
          {props.otpField.expiresInSeconds.toFixed(0).padStart(2, '0')}s
        </Text>
        <Text>{')'}</Text>
      </Box>
    </Box>
  );
};

const copyStatusForField = (field: UiItemDetailsField) => {
  return appState.copyToClipboardRequest.pipe(
    // skip current state
    skip(1),
    map((request) =>
      'field' in request && request.field === field
        ? request.status
        : 'not-this-item'
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

export const FieldCursor = (props: { field: UiItemDetailsField }) => {
  const [status] = useSelect(
    (field) => copyStatusForField(field),
    [props.field],
    'not-this-item'
  );

  if (status === 'failed') {
    return <Text color="red">{'>'}</Text>;
  }
  return <Text color="green">{'>'}</Text>;
};

export const FieldStatus = (
  props: BoxProps & { field: UiItemDetailsField }
) => {
  const [status] = useSelect(
    (field) => copyStatusForField(field),
    [props.field],
    'not-this-item'
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
