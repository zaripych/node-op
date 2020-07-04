import React from 'react';
import { Box } from 'ink';
import { VerticalLimitView } from './limitView';
import { useLog } from '../hooks/log';
import { Keystroke } from './keystroke';

interface IProps {
  viewportHeight: number;
}

export const LogItems: React.FC<IProps> = (props) => {
  const { lines } = useLog();

  return (
    <Box flexDirection="column">
      <Box flexShrink={0}>
        This is an internal log of the application, you can switch back to
        search view by pressing <Keystroke value="Ctrl+L" /> again, or{' '}
        <Keystroke value="Ctrl+C" /> to quit
      </Box>
      <VerticalLimitView
        itemHeight={1}
        itemCount={lines.length}
        viewportHeight={props.viewportHeight - 1}
        render={(offset, len) => {
          const items = React.useMemo(() => lines.slice(offset, offset + len), [
            offset,
            len,
            lines,
          ]);
          return (
            <React.Fragment>
              {items.map((item, i) => (
                <Box key={i} flexShrink={0}>
                  {item}
                </Box>
              ))}
            </React.Fragment>
          );
        }}
      />
    </Box>
  );
};
