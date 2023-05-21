import { Box, Text } from 'ink';
import React from 'react';
import type { Observable } from 'rxjs';
import { isObservable } from 'rxjs';

import { useSelect } from '../building-blocks';
import { useAppInput, useMeasureLayout } from '../hooks';

type Props = {
  children?: React.ReactNode;

  contentHeight?: number;
  contentHeightDeps?: React.DependencyList;
  viewportHeight?: number;

  initialOffset?: number;
  offset?:
    | number
    | (Observable<number> & {
        readonly value: number;
      });
  setOffset?: (cb: React.SetStateAction<number>) => void;

  onLayout?: OnLayout;
  disableInput?: boolean;
};

export type OnLayout = (state: {
  offset: number;
  contentHeight: number;
  viewportHeight: number;
  maxOffset: number;
  setOffset: (cb: React.SetStateAction<number>) => void;
}) => void;

function useSetOffset(props: Props) {
  if (
    'offset' in props &&
    typeof props.offset === 'number' &&
    'setOffset' in props &&
    typeof props.setOffset === 'function'
  ) {
    // classic controlled input component:
    return [props.offset, props.setOffset] as const;
  } else if (
    'offset' in props &&
    isObservable(props.offset) &&
    'setOffset' in props &&
    typeof props.setOffset === 'function'
  ) {
    // observable controlled input component:
    const [offset] = useSelect(props.offset);
    return [offset, props.setOffset] as const;
  } else {
    // uncontrolled component with internal state
    if (props.offset || props.setOffset) {
      throw new Error(
        `Unknown combination of offset/setOffset props, both need to be specified or both need to be undefined.`
      );
    }
    const [state, setState] = React.useState(props.initialOffset ?? 0);
    return [state, setState] as const;
  }
}

export const VerticalScrollView: React.ComponentType<Props> = (props) => {
  const [measuredContentHeight, setMeasuredContentHeight] = React.useState(0);
  const [measuredViewportHeight, setMeasuredViewportHeight] = React.useState(0);
  const { refForMeasuring } = useMeasureLayout(({ key, layout }) => {
    if (key === 'content') {
      setMeasuredContentHeight(layout.height);
    } else if (key === 'viewport') {
      setMeasuredViewportHeight(layout.height);
    }
  }, props.contentHeightDeps || []);

  const contentHeight =
    'contentHeight' in props && typeof props.contentHeight === 'number'
      ? props.contentHeight
      : measuredContentHeight;
  const viewportHeight =
    'viewportHeight' in props && typeof props.viewportHeight === 'number'
      ? props.viewportHeight
      : measuredViewportHeight;
  const maxOffset = contentHeight - viewportHeight;

  const [offset, setOffsetCore] = useSetOffset(props);

  const thumbHeight =
    viewportHeight <= contentHeight
      ? Math.trunc(
          Math.min(
            viewportHeight,
            Math.max(1, viewportHeight * (viewportHeight / contentHeight))
          )
        )
      : viewportHeight;

  const thumbPosition =
    offset === maxOffset
      ? viewportHeight - thumbHeight
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
        const result = Math.min(Math.max(value, 0), Math.max(0, maxOffset));
        return result;
      };
      if (typeof changer === 'number') {
        setOffsetCore(limit(changer));
      } else {
        setOffsetCore((value) => limit(changer(value)));
      }
    },
    [setOffsetCore, maxOffset]
  );

  const setOffsetRef = React.useRef(setOffset);
  setOffsetRef.current = setOffset;

  useAppInput((_, key) => {
    if (props.disableInput) {
      return;
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

  React.useEffect(() => {
    if (!props.onLayout) {
      return;
    }
    if (contentHeight === 0 && viewportHeight === 0) {
      return;
    }
    props.onLayout({
      offset,
      contentHeight,
      viewportHeight,
      maxOffset,
      setOffset: setOffsetRef.current,
    });
  }, [offset, maxOffset, contentHeight, viewportHeight]);

  return (
    <Box flexDirection="row">
      <Box
        flexDirection="row"
        flexGrow={1}
        overflow="hidden"
        ref={refForMeasuring('viewport')}
      >
        <Box
          flexDirection="column"
          marginTop={-offset}
          marginLeft={0}
          flexShrink={0}
          flexGrow={1}
        >
          <Box
            ref={refForMeasuring('content')}
            flexShrink={0}
            flexGrow={1}
            flexDirection="column"
          >
            {props.children}
          </Box>
        </Box>
      </Box>
      {thumbHeight < viewportHeight && (
        <Box width={1} flexShrink={0} flexGrow={0} flexDirection="column">
          <Box width={1} marginTop={thumbPosition}>
            <React.Fragment>
              {offset === 0 && (
                <Text>{['┬\n', '│\n'.repeat(thumbHeight - 1)]}</Text>
              )}
              {offset > 0 && offset < maxOffset && (
                <Text>{'│\n'.repeat(thumbHeight)}</Text>
              )}
              {offset === maxOffset && (
                <Text>{['│\n'.repeat(thumbHeight - 1), '┴\n']}</Text>
              )}
            </React.Fragment>
          </Box>
        </Box>
      )}
    </Box>
  );
};
