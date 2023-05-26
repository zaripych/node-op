import type { DOMElement } from 'ink';
import React from 'react';

import { screenSize } from '../state/screenSize';

type Layout = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

function parentAtIndex(node: DOMElement | null, index: number) {
  if (!node) {
    return undefined;
  }
  if (index === 0) {
    return node;
  }
  if (!node.parentNode) {
    return node;
  }
  let result = node.parentNode;
  let current = index - 1;
  while (result.parentNode && current > 0) {
    current -= 1;
    result = result.parentNode;
  }
  return result;
}

export function useMeasureLayout<K extends string>(
  onUpdate?: (opts: { key: K; layout: Layout }) => void,
  deps: React.DependencyList = []
) {
  const layoutRef = React.useRef<{ [P in K]?: Layout }>({});
  const nodeRef = React.useRef<{ [P in K]?: DOMElement }>({});
  const callbackRef = React.useRef<typeof onUpdate>(onUpdate);
  callbackRef.current = onUpdate;

  const callback = React.useCallback<NonNullable<typeof onUpdate>>(
    (...args) => {
      callbackRef.current?.(...args);
    },
    []
  );

  const calculateLayout = React.useCallback(
    <S extends K>(key: S) => {
      const layout = layoutRef.current[key];
      const node = nodeRef.current[key];
      if (!node) {
        if (layout) {
          delete layoutRef.current[key];
        }
        return;
      }
      const next = node.yogaNode?.getComputedLayout();
      if (!next || Number.isNaN(next.width)) {
        return;
      }

      if (
        layout &&
        next.top === layout.top &&
        next.left === layout.left &&
        next.width == layout.width &&
        next.height === layout.height
      ) {
        // no changes
        return;
      }

      layoutRef.current[key] = next;

      callback({ key, layout: next });

      return next;
    },
    [layoutRef, nodeRef, callback]
  );

  const updateLayout = React.useCallback(
    (key: K) => {
      const result = calculateLayout(key);
      if (!result) {
        setTimeout(updateLayout, 0, key);
        return;
      }
      return result;
    },
    [calculateLayout]
  );

  const refForMeasuring = (key: K, parentIndex = 0) =>
    React.useCallback(
      (instance: DOMElement | null) => {
        const node = parentAtIndex(instance, parentIndex);
        if (!node) {
          return;
        }
        const next = {
          ...nodeRef.current,
          [key]: node,
        };
        nodeRef.current = next;
        updateLayout(key);
      },
      [nodeRef, key]
    );

  React.useLayoutEffect(() => {
    (Object.keys(nodeRef.current) as K[]).forEach((key) => updateLayout(key));
  }, [nodeRef, ...deps]);

  React.useLayoutEffect(() => {
    const subscription = screenSize.subscribe({
      next: () => {
        (Object.keys(nodeRef.current) as K[]).forEach((key) =>
          updateLayout(key)
        );
      },
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    currentLayout: (key: K) => layoutRef.current[key],
    refForMeasuring,
  };
}
