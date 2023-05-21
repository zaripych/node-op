import { writeFile } from 'fs/promises';
import { EOL } from 'os';
import React from 'react';
import type { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { tag } from 'rxjs-spy/operators';
import { formatWithOptions } from 'util';

const logs = new BehaviorSubject<string[]>([]);

export function log(arg: unknown, ...rest: unknown[]) {
  const text = formatWithOptions(
    { colors: true, maxArrayLength: 3 },
    arg as string,
    ...rest
  );
  const next = [...text.split('\n'), ...logs.value];
  logs.next(next);
  writeFile('./log.txt', [text, EOL, EOL].join(''), { flag: 'a' }).catch(() => {
    return;
  });
}

export function optionalTag<T>(name?: string) {
  return (source: Observable<T>) => {
    return source.pipe(name ? tag(name) : (x) => x);
  };
}

export function useLog() {
  const [lines, setLines] = React.useState(logs.value);

  React.useEffect(() => {
    const subscription = logs.pipe(debounceTime(1000 / 25)).subscribe({
      next: (value) => {
        setLines(value);
      },
      error: (_err) => {
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
