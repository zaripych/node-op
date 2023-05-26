import type { Observable } from 'rxjs';

export function optionalTag<T>(_name?: string) {
  return (source: Observable<T>) => {
    return source;
  };
}

export function useLog() {
  return {
    log: console.log.bind(console),
    lines: [],
  };
}
