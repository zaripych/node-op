import { marbles } from 'rxjs-marbles/jest';
import { createStateWithInitial } from '../state';
import { IAction } from '../types';
import { take } from 'rxjs/operators';

describe(createStateWithInitial.name, () => {
  it(
    'created state registers subscription in sharedSubscriptions for later cleanup',
    marbles((m) => {
      const actions = m.hot<IAction>('--a--');
      const sharedSubscriptions = new WeakMap();

      const result = createStateWithInitial(
        (a) => a,
        ('b' as unknown) as IAction,
        {
          actions,
          sharedSubscriptions,
        }
      );

      m.expect(result).toBeObservable('b-a--');
      m.expect(actions).toHaveSubscriptions('^-----');
      m.flush();

      expect(sharedSubscriptions.has(result)).toBe(true);
    })
  );

  // eslint-disable-next-line jest/expect-expect
  it(
    'created state never unsubscribes from actions',
    marbles((m) => {
      const actions = m.hot<IAction>('--a--');

      const result = createStateWithInitial(
        (a) => a,
        ('b' as unknown) as IAction,
        {
          actions,
          sharedSubscriptions: new WeakMap(),
        }
      );

      m.expect(result).toBeObservable('b-a--');
      m.expect(actions).toHaveSubscriptions('^-----');
    })
  );

  // eslint-disable-next-line jest/expect-expect
  it(
    'created state unsubscribes from actions complete, which is never',
    marbles((m) => {
      const actions = m.hot<IAction>('--a--|');
      const result = createStateWithInitial(
        (a) => a,
        ('b' as unknown) as IAction,
        {
          actions,
          sharedSubscriptions: new WeakMap(),
        }
      );

      m.expect(result).toBeObservable('b-a--|');
      m.expect(actions).toHaveSubscriptions('^----!');
    })
  );

  // eslint-disable-next-line jest/expect-expect
  it(
    'created state unsubscribes when we complete subscription in selector',
    marbles((m) => {
      const actions = m.hot<IAction>('--a--|');
      const result = createStateWithInitial(
        (a) => a.pipe(take(1)),
        ('b' as unknown) as IAction,
        {
          actions,
          sharedSubscriptions: new WeakMap(),
        }
      );

      m.expect(result).toBeObservable('b-(a|)');
      m.expect(actions).toHaveSubscriptions('^-!');
    })
  );
});
