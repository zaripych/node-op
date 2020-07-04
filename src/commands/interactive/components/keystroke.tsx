import React from 'react';
import { Color } from 'ink';

interface IProps {
  value: string;
}

export const Keystroke: React.FC<IProps> = (props) => {
  return (
    <Color red bold>
      {props.value}
    </Color>
  );
};
