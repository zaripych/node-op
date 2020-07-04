import React from 'react';
import { Box } from 'ink';
import { useAppInput } from '../hooks';

interface ILimitViewProps {
  contentHeight: number;
  viewportHeight: number;
  viewportWidth: number;
}

export const VerticalScrollView: React.FC<ILimitViewProps> = (props) => {
  const totalHeight = props.contentHeight;
  const viewportHeight = props.viewportHeight;
  const maxOffset = totalHeight - viewportHeight - 1;

  const [offset, setOffsetCore] = React.useState(0);

  const thumbHeight =
    viewportHeight <= totalHeight
      ? Math.trunc(
          Math.min(
            viewportHeight,
            Math.max(1, viewportHeight * (viewportHeight / totalHeight))
          )
        )
      : viewportHeight;

  const thumbPosition =
    offset === maxOffset
      ? viewportHeight - thumbHeight + 1
      : Math.min(
          Math.max(
            0,
            Math.trunc((offset / maxOffset) * (viewportHeight - thumbHeight))
          ),
          viewportHeight - thumbHeight
        );

  const setOffset = React.useCallback(
    (changer: number | ((value: number) => number)) => {
      const limit = (value: number): number => {
        return Math.min(Math.max(value, 0), Math.max(0, maxOffset));
      };
      if (typeof changer === 'number') {
        setOffsetCore(limit(changer));
      } else {
        setOffsetCore((value) => limit(changer(value)));
      }
    },
    [setOffsetCore, maxOffset]
  );

  useAppInput((_, key) => {
    if (key.home) {
      setOffset(0);
    }
    if (key.end) {
      setOffset(maxOffset);
    }
    if (key.pageUp) {
      setOffset((value) => value - viewportHeight);
    }
    if (key.pageDown) {
      setOffset((value) => value + viewportHeight);
    }
    if (key.upArrow) {
      setOffset((value) => value - 1);
    }
    if (key.downArrow) {
      setOffset((value) => value + 1);
    }
  });

  return (
    <Box flexDirection="row" flexGrow={1}>
      <Box
        flexDirection="column"
        marginTop={-offset}
        marginLeft={0}
        // flexGrow={1}
        // height={props.contentHeight}
        width={props.viewportWidth - 1}
      >
        {props.children}
      </Box>
      {thumbHeight < viewportHeight && (
        <Box width={1} flexShrink={0} flexGrow={0} flexDirection="column">
          <Box width={1} marginTop={thumbPosition}>
            <React.Fragment>
              {offset === 0 && ['┬\n', '│\n'.repeat(thumbHeight - 1)]}
              {offset > 0 && offset < maxOffset && '│\n'.repeat(thumbHeight)}
              {offset === maxOffset && ['│\n'.repeat(thumbHeight - 1), '┴\n']}
            </React.Fragment>
          </Box>
        </Box>
      )}
    </Box>
  );
};
