import React from 'react';
import type { Observable } from 'rxjs';

import { runEpic } from './epics';
import type { Action } from './types';
import { useComponentName } from './useComponentName';

export function useEpic(
  epic: (actions: Observable<Action>) => Observable<Action>,
  deps: React.DependencyList = [],
  opts: { name?: string; silent?: boolean } = {}
) {
  const name = useComponentName(opts.name || 'useEpic');
  React.useEffect(() => {
    const subscription = runEpic(epic, { ...opts, name: opts.name ?? name });
    return () => subscription.unsubscribe();
  }, [...deps]);
}
