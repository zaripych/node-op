import type { Subscription } from 'rxjs';
import { Subject } from 'rxjs';

import type { Action } from './types';

export const actions = new Subject<Action>();
export const observableActions = actions.asObservable();
export const sharedSubscriptions = new WeakMap<object, Subscription>();
