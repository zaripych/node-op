import { Text } from 'ink';
import React from 'react';

interface Props {
  value: string;
}

export const Keystroke: React.FC<Props> = (props) => {
  return (
    <Text color="red" bold>
      {props.value}
    </Text>
  );
};
