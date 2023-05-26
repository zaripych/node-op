import type { Key as InkKey } from 'ink';

export type Key = InkKey & {
  home: boolean;
  end: boolean;
  tab: boolean;
};

export function keyInput(input: string, key: Key) {
  return {
    type: keyInput,
    input,
    key,
  };
}
