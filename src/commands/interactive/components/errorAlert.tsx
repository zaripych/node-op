import { Box,Text } from 'ink';
import React from 'react';

import type { IErrorInfo } from '../state';

interface IProps {
  error: IErrorInfo;
  retry?: () => void;
}

export const ErrorAlert: React.FC<IProps> = (props) => {
  return (
    <Box flexDirection="column">
      <Box flexShrink={0}>
        <Text color="red" bold>
          {props.error.message}
        </Text>
      </Box>
      <Box flexShrink={1}>
        <Text color="gray">{props.error.details}</Text>
      </Box>
    </Box>
  );
};

export const HorizontalErrorAlert: React.FC<IProps> = (props) => {
  return (
    <Box flexDirection="row">
      <Box flexShrink={0}>
        <Text color="red" bold>
          {props.error.message}
        </Text>
      </Box>
      <Box flexShrink={1}>
        <Text color="gray" wrap={'truncate-end'}>
          {props.error.details}
        </Text>
      </Box>
    </Box>
  );
};
