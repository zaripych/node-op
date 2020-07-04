import React from 'react';
import { Box, Color } from 'ink';
import { useAppInput } from '../hooks';

interface ILimitViewProps {
  itemHeight: number;
  itemCount: number;
  viewportHeight: number;
  showCursor?: boolean;
  cursor?: number;
  setCursor?: (cb: React.SetStateAction<number>) => void;
  cursorChanged?: (cursor: number) => void;
  offset?: number;
  setOffset?: (cb: React.SetStateAction<number>) => void;
  offsetChanged?: (offset: number) => void;
  renderCursor?: (cursorAt: number) => React.ReactNode;
  render: (offset: number, len: number, cursorAt: number) => React.ReactNode;
}

const clampCursor = (value: number, itemsCount: number): number =>
  Math.min(Math.max(value, 0), Math.max(0, itemsCount - 1));

export const useCursorRef = (props: {
  itemCount: number;
  cursor?: number;
  setCursor?: (cb: React.SetStateAction<number>) => void;
  cursorChanged?: (cursor: number) => void;
}) => {
  const [cursor, setCursorCore] =
    'cursor' in props &&
    typeof props.cursor === 'number' &&
    'setCursor' in props &&
    typeof props.setCursor === 'function'
      ? [props.cursor, props.setCursor]
      : React.useState(props.cursor ?? 0);

  const setCursor = React.useCallback(
    (changer: React.SetStateAction<number>) => {
      if (typeof changer === 'number') {
        setCursorCore(clampCursor(changer, props.itemCount));
      } else {
        setCursorCore((value) => clampCursor(changer(value), props.itemCount));
      }
    },
    [setCursorCore, props.itemCount]
  );

  React.useEffect(() => {
    if (props.cursorChanged) {
      props.cursorChanged(cursor);
    }
  }, [cursor, props.cursorChanged]);

  React.useEffect(() => {
    setCursorCore((value) => {
      const next = clampCursor(value, props.itemCount);
      if (next !== value) {
        return next;
      } else {
        return value;
      }
    });
  }, [props.itemCount]);

  return {
    cursor,
    setCursor,
  };
};

export const VerticalLimitView: React.FC<ILimitViewProps> = (props) => {
  const totalHeight = props.itemHeight * props.itemCount;
  const viewportHeight = props.viewportHeight;
  const maxOffset = totalHeight - viewportHeight - 1;

  const { cursor, setCursor } = useCursorRef(props);

  const [offset, setOffsetCore] =
    'offset' in props &&
    typeof props.offset === 'number' &&
    'setOffset' in props &&
    typeof props.setOffset === 'function'
      ? [props.offset, props.setOffset]
      : React.useState(props.offset ?? 0);

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

  React.useEffect(() => {
    if (props.offsetChanged) {
      props.offsetChanged(offset);
    }
  }, [offset, props.offsetChanged]);

  React.useEffect(() => {
    // keep cursor in view
    if (
      cursor / props.itemHeight >=
      offset / props.itemHeight + viewportHeight
    ) {
      setOffset((v) => v + 5);
    }
    if (cursor / props.itemHeight <= offset / props.itemHeight) {
      setOffset((v) => v - 5);
    }
  }, [
    cursor / props.itemHeight >= offset / props.itemHeight + viewportHeight ||
      cursor / props.itemHeight <= offset / props.itemHeight,
    setOffset,
  ]);

  useAppInput((_, key) => {
    if (key.home) {
      setCursor(0);
      setOffset(0);
    }
    if (key.end) {
      setCursor(props.itemCount);
      setOffset(maxOffset);
    }
    if (key.pageUp) {
      setOffset((value) => value - viewportHeight);
    }
    if (key.pageDown) {
      setOffset((value) => value + viewportHeight);
    }
    if (key.upArrow) {
      if (props.showCursor) {
        setCursor((value) => value - 1);
      } else {
        setOffset((value) => value - 1);
      }
    }
    if (key.downArrow) {
      if (props.showCursor) {
        setCursor((value) => value + 1);
      } else {
        setOffset((value) => value + 1);
      }
    }
  });

  return (
    <Box flexDirection="row" flexGrow={1}>
      {props.showCursor && props.itemCount > 0 && (
        <Box width={1} flexShrink={0}>
          <Box
            marginTop={cursor / props.itemHeight - offset / props.itemHeight}
          >
            {props.renderCursor?.(cursor) ?? <Color green>{'>'}</Color>}
          </Box>
        </Box>
      )}
      <Box flexDirection="column" marginLeft={1} flexGrow={1}>
        {props.render(
          offset / props.itemHeight,
          offset / props.itemHeight + viewportHeight / props.itemHeight + 1,
          cursor
        )}
      </Box>
      {thumbHeight < viewportHeight && (
        <Box width={1} flexShrink={0} flexGrow={0} flexDirection="column">
          <Box width={1} marginTop={thumbPosition} textWrap={'wrap'}>
            <React.Fragment>
              {offset === 0 && ['┬', '│'.repeat(thumbHeight - 1)]}
              {offset > 0 && offset < maxOffset && '│'.repeat(thumbHeight)}
              {offset === maxOffset && ['│'.repeat(thumbHeight - 1), '┴']}
            </React.Fragment>
          </Box>
        </Box>
      )}
    </Box>
  );
};
