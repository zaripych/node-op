import type { BehaviorSubject,Observable, Subscription } from 'rxjs';
import { Subject } from 'rxjs';

import type { IAction } from './types';

export const actions = new Subject<IAction>();
export const sharedSelects = new WeakMap<
  object,
  Observable<unknown> | BehaviorSubject<unknown>
>();
export const sharedSubscriptions = new WeakMap<object, Subscription>();
