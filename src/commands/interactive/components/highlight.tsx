import { Text } from 'ink';
import React from 'react';

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
      text: text.substring(result.index, result.index + substring.length),
    };
    result = regexp.exec(text);
  }
}

export const Highlight: React.FC<IProps> = (props) => {
  if (!props.text) {
    return null;
  }
  if (!props.substring) {
    return <Text>{props.text}</Text>;
  }
  const indexes = React.useMemo(
    () => [...allIndexes(props.text, props.substring)],
    [props.text, props.substring]
  );
  if (indexes.length === 0) {
    return <Text>{props.text}</Text>;
  }
  return (
    <React.Fragment>
      {indexes.map((index, i) => (
        <React.Fragment key={i}>
          <Text>
            {props.text.substring(
              i === 0 ? 0 : indexes[i - 1]?.end || 0,
              index.start
            )}
          </Text>
          <Text color="red" backgroundColor="whiteBright" bold>
            {index.text}
          </Text>
        </React.Fragment>
      ))}
      <Text>{props.text.substring(indexes[indexes.length - 1]?.end || 0)}</Text>
    </React.Fragment>
  );
};
