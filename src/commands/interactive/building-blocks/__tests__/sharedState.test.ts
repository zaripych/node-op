import { expect,it } from '@jest/globals';
import { marbles } from 'rxjs-marbles/jest';

import { sharedState } from '../state';
import type { Action, ActionsTransform } from '../types';

it(
  'can create state observable with initial value',
  marbles((m) => {
    const actions = m.hot<Action>('--aah-');
    const selector: ActionsTransform<Action> = (a) => a;

    const result = sharedState(
      selector,
      { initial: 'b' as unknown as Action },
      {
        actions,
      }
    );

    expect(result.value).toBe('b');

    m.expect(result).toBeObservable('b-a-h-');
    m.expect(actions).toHaveSubscriptions('^-----');
    m.flush();

    expect(result.value).toBe('h');
  })
);

it(
  'returned observable unsubscribes from consumed observables when unsubscribed from',
  marbles((m) => {
    const actions = m.hot<Action>('--a--');
    const selector: ActionsTransform<Action> = (a) => a;

    const result = sharedState(
      selector,
      { initial: 'b' as unknown as Action },
      {
        actions,
      }
    );

    expect(result.value).toBe('b');

    m.expect(result, '^----!').toBeObservable('b-a--');
    m.expect(actions).toHaveSubscriptions('^----!');
    m.flush();

    expect(result.value).toBe('a');
  })
);

it(
  `can create state observable which shares it's state regardless of number of subscribers`,
  marbles((m) => {
    const actions = m.hot<Action>('--a--');
    const selector: ActionsTransform<Action> = (a) => a;

    const result = sharedState(
      selector,
      { initial: 'b' as unknown as Action },
      {
        actions,
      }
    );

    expect(result.value).toBe('b');

    m.expect(result).toBeObservable('b-a--');
    m.expect(result).toBeObservable('b-a--');
    m.expect(result, '-^---').toBeObservable('-ba--');
    m.expect(result, '---^-').toBeObservable('---a-');
    m.expect(actions).toHaveSubscriptions('^-----');
    m.flush();

    expect(result.value).toBe('a');
  })
);
