import { distinctUntilChanged, interval, map } from 'rxjs';

import { sharedState } from '../building-blocks';

function getScreenSize() {
  return {
    height: Math.floor(
      typeof process.stderr.rows === 'number' ? process.stderr.rows - 1 : 40
    ),
    width: Math.floor(
      typeof process.stderr.columns === 'number' ? process.stderr.columns : 80
    ),
  };
}

export const screenSize = sharedState(
  () =>
    interval(100).pipe(
      map(getScreenSize),
      distinctUntilChanged(
        (p, n) => p.height === n.height && p.width === n.width
      )
    ),
  {
    initial: getScreenSize(),
  }
);
