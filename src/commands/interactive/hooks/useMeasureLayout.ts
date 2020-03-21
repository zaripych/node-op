import React from 'react';
import { BoxProps } from 'ink';
import { isTruthy } from '../building-blocks';

// tslint:disable: no-any
// tslint:disable: no-unsafe-any
// tslint:disable: strict-boolean-expressions
// NOTE: This module is a hackery around internal ink api's, so we allow a little bit of `any`

interface INode {
  parentNode?: INode;
  getComputedLeft(): number;
  getComputedTop(): number;
  getComputedHeight(): number;
  getComputedWidth(): number;
}

export interface ILayout {
  left: number;
  top: number;
  width: number;
  height: number;
}

function parentAtIndex(node: INode, index: number) {
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

export function useMeasureLayout<K extends string | number | symbol>(
  callback?: (key: K, layout: ILayout) => void,
  deps: React.DependencyList = []
) {
  const layoutRef = React.useRef<{ [P in K]?: ILayout }>({});
  const nodeRef = React.useRef<{ [P in K]?: INode }>({});
  const getNodeRefCb = (key: K, parentIndex = 0) =>
    React.useCallback(
      (instance: React.Component<BoxProps> | null) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyInstance = instance as any;
        const node = parentAtIndex(
          anyInstance?.nodeRef?.current?.yogaNode,
          parentIndex
        );
        const next = {
          ...nodeRef.current,
          [key]: node,
        };
        nodeRef.current = next;
      },
      [nodeRef, key]
    );

  React.useLayoutEffect(() => {
    const calculateLayout = <S extends K>(key: S) => {
      const layout = layoutRef.current[key];
      const node = nodeRef.current[key];
      if (!node) {
        if (layout) {
          delete layoutRef.current[key];
        }
        return;
      }
      const height = node.getComputedHeight();
      if (typeof height !== 'number' || Number.isNaN(height)) {
        return;
      }
      const width = node.getComputedWidth();
      if (typeof width !== 'number' || Number.isNaN(width)) {
        return;
      }
      const left = node.getComputedLeft();
      const top = node.getComputedTop();

      if (
        left === layout?.left &&
        top === layout?.top &&
        width === layout?.width &&
        height === layout?.height
      ) {
        // no changes
        return;
      }

      const next = { left, top, width, height };

      layoutRef.current[key] = next;

      if (callback) {
        callback(key, next);
      }

      return next;
    };

    const delayedCalculate = (key: K) => {
      const result = calculateLayout(key);
      if (typeof result !== 'number') {
        setTimeout(delayedCalculate, 0);
        return;
      }
      return result;
    };

    (Object.keys(nodeRef.current) as K[]).forEach(key => delayedCalculate(key));
  }, [layoutRef, Object.values(nodeRef.current).filter(isTruthy).length, deps]);

  return {
    currentLayout: (key: K) => layoutRef.current[key],
    refForMeasuring: getNodeRefCb,
  };
}
