import { Subject, Observable, Subscription, BehaviorSubject } from 'rxjs';
import { IAction } from './types';

export const actions = new Subject<IAction>();
export const sharedSelects = new WeakMap<
  object,
  Observable<unknown> | BehaviorSubject<unknown>
>();
export const sharedSubscriptions = new WeakMap<object, Subscription>();
