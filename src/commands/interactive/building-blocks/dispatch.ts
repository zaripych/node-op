import { actions } from './details';
import type { Action } from './types';

export const dispatch = (action: Action) => {
  actions.next(action);
};
