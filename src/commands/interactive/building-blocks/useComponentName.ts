import React from 'react';

function detectName(parent: string) {
  if (!process.env['DEV']) {
    return undefined;
  }
  const stack = new Error().stack;
  if (!stack) {
    return undefined;
  }
  const lines = stack.split('\n');
  const lineIndex = lines.findIndex((line) => line.includes('at ' + parent));
  if (lineIndex < 0) {
    return undefined;
  }
  const match = lines.slice(lineIndex + 1)[0]?.match(/at (.*) \(/);
  if (!match) {
    return undefined;
  }
  return match[1];
}

export function useComponentName(parent?: string) {
  const name = React.useMemo(
    () => detectName(parent ?? 'useComponentName'),
    []
  );
  return name;
}
