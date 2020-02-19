import React from 'react';
import { formatWithOptions } from 'util';
import { BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { writeFile } from 'fs-extra';

const logs = new BehaviorSubject<string[]>([]);

export function log(arg: unknown, ...rest: unknown[]) {
  const text = formatWithOptions({ colors: true }, arg as string, ...rest);
  const next = [...text.split('\n'), ...logs.value];
  logs.next(next);
  writeFile('./log.txt', text + '\n' + '\n', { flag: 'a' }).catch(() => {
    return;
  });
}

export function useLog() {
  const [lines, setLines] = React.useState(logs.value);

  React.useEffect(() => {
    const subscription = logs.pipe(debounceTime(1000 / 25)).subscribe({
      next: value => {
        setLines(value);
      },
      error: _err => {
        return;
      },
    });
    return () => subscription.unsubscribe();
  }, [logs, setLines]);

  return {
    log,
    lines,
  };
}
