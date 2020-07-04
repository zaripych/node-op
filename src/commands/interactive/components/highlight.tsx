import React from 'react';
import { Color, Box } from 'ink';

interface IProps {
  text: string;
  substring: string;
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function* allIndexes(text: string, substring: string) {
  const regexp = new RegExp(escapeRegExp(substring), 'ig');
  let result = regexp.exec(text);
  while (result && result.index >= 0) {
    yield {
      start: result.index,
      end: result.index + substring.length,
    };
    result = regexp.exec(text);
  }
}

export const Highlight: React.FC<IProps> = (props) => {
  if (!props.text) {
    return null;
  }
  if (!props.substring) {
    return <React.Fragment>{props.text}</React.Fragment>;
  }
  const indexes = React.useMemo(
    () => [...allIndexes(props.text, props.substring)],
    [props.text, props.substring]
  );
  if (indexes.length === 0) {
    return <React.Fragment>{props.text}</React.Fragment>;
  }
  return (
    <React.Fragment>
      {indexes.map((index, i) => (
        <Box key={i}>
          {props.text.substring(i === 0 ? 0 : indexes[i - 1].end, index.start)}
          <Color red bgWhiteBright bold>
            {props.substring}
          </Color>
        </Box>
      ))}
      {props.text.substring(indexes[indexes.length - 1].end)}
    </React.Fragment>
  );
};
