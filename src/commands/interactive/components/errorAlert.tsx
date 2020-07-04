import React from 'react';
import { Color, Box } from 'ink';
import { IErrorInfo } from '../state';

interface IProps {
  error: IErrorInfo;
  retry?: () => void;
}

export const ErrorAlert: React.FC<IProps> = (props) => {
  return (
    <Box flexDirection="column">
      <Box flexShrink={0}>
        <Color red bold>
          {props.error.message}
        </Color>
      </Box>
      <Box flexShrink={1}>
        <Color gray>{props.error.details}</Color>
      </Box>
    </Box>
  );
};

export const HorizontalErrorAlert: React.FC<IProps> = (props) => {
  return (
    <Box flexDirection="row">
      <Box flexShrink={0}>
        <Color red bold>
          {props.error.message}
        </Color>
      </Box>
      <Box flexShrink={1} textWrap={'truncate-end'}>
        <Color gray>{props.error.details}</Color>
      </Box>
    </Box>
  );
};
