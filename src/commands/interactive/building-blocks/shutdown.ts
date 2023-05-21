import { observableActions } from './details';
import { ofType } from './helpers';

export function shutdown() {
  return {
    type: shutdown,
  };
}

export const shutdownActions = observableActions.pipe(ofType(shutdown));
