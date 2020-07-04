import { marbles } from 'rxjs-marbles/jest';
import { sharedState } from '../state';
import { take } from 'rxjs/operators';

describe(sharedState.name, () => {
  it(
    'shared state returns same observable for same selector as long as it is not complete',
    marbles((m) => {
      const actions = m.hot('--a--');

      const selector = (a) => a;

      const deps = {
        actions,
        sharedSelects: new WeakMap(),
        sharedSubscriptions: new WeakMap(),
      };

      const result = sharedState(selector, undefined, deps);
      const alternative = sharedState(selector, undefined, deps);

      expect(result).toBe(alternative);

      m.expect(result).toBeObservable('--a--');
      m.expect(actions).toHaveSubscriptions('^-----');
      m.flush();

      expect(deps.sharedSelects.has(selector)).toBe(true);
    })
  );

  it(
    'shared state unsubscribes and unregisters observable on completion',
    marbles((m) => {
      const actions = m.hot('--a--');

      const selector = (a) => a.pipe(take(1));

      const deps = {
        actions,
        sharedSelects: new WeakMap(),
        sharedSubscriptions: new WeakMap(),
      };

      const result = sharedState(selector, undefined, deps);

      expect(deps.sharedSelects.has(selector)).toBe(true);
      expect(deps.sharedSubscriptions.has(result)).toBe(true);

      m.expect(result).toBeObservable('--(a|)--');
      m.expect(actions).toHaveSubscriptions('^-!---');
      m.flush();

      expect(deps.sharedSelects.has(selector)).toBe(false);
      expect(deps.sharedSubscriptions.has(result)).toBe(false);

      const alternative = sharedState(selector, undefined, deps);

      expect(alternative).not.toBe(result);
    })
  );
});
