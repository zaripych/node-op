/**
 * @jest-environment jsdom
 * @jest-environment-options { "customExportConditions": ["node"] }
 */
import { expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { asyncScheduler, from, NEVER, observeOn } from 'rxjs';
import { marbles } from 'rxjs-marbles/jest';

import { sharedState } from '..';
import { useSelect } from '../useSelect';

it('sets state for a synchronously resolved stream', () => {
  const { result } = renderHook(() => useSelect(() => from([1, 2, 3]), [], 0));
  expect(result.current[0]).toBe(3);
});

it('sets state for an asynchronously resolved stream', async () => {
  const { result, rerender } = renderHook(() =>
    useSelect(() => from([1, 2, 3]).pipe(observeOn(asyncScheduler)), [], 0)
  );
  expect(result.current[0]).toBe(0);
  await act(async () => {
    rerender();
    await new Promise((res) => setTimeout(res, 0));
  });
  expect(result.current[0]).toBe(3);
});

it(
  'provides observable result to consume along with state',
  marbles((m) => {
    const input = m.cold('a-b-c');

    const { result } = renderHook(() => useSelect(() => input, []));

    expect(result.current[0]).toBe(undefined);

    act(() => {
      m.expect(result.current[1]).toBeObservable('a-b-c');
      m.expect(input).toHaveSubscriptions('^-----');
      m.flush();
    });
  })
);

it(
  'unsubscribes from the source observable',
  marbles((m) => {
    const input = m.cold('a-b-c');

    const { unmount } = renderHook(() => useSelect(() => input, []));

    act(() => {
      m.scheduler.frame = 5;
      unmount();
      m.expect(input).toHaveSubscriptions('^----!');
      m.flush();
    });
  })
);

it('passes in dependencies to selector', () => {
  const { result } = renderHook(() =>
    useSelect(
      (first, second, _actions) => from([{ first, second }]),
      ['first', 'second']
    )
  );
  expect(result.current[0]).toEqual({
    first: 'first',
    second: 'second',
  });
});

it('allows passing in shared state', () => {
  const state = sharedState(() => from([1, 2, 3]), { initial: 1 });
  const { result } = renderHook(() => useSelect(state));
  expect(result.current[0]).toEqual(3);
});

it(`setting an initial value leads to setState once`, () => {
  let setStateMock;
  const deps = {
    useMemo: React.useMemo,
    useState: jest.fn((param) => {
      const [state, setState] = React.useState(param);
      setStateMock = jest.fn(setState);
      return [state, setStateMock] as const;
    }),
    useEffect: React.useEffect,
  };
  const { result } = renderHook(() =>
    useSelect(
      () => NEVER,
      [],
      'initial',
      deps as unknown as typeof useSelect.defaultDeps
    )
  );
  expect(result.current[0]).toEqual('initial');
  expect(setStateMock).toBeCalledTimes(1);
});
