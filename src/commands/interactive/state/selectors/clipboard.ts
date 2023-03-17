import { from, merge,of } from 'rxjs';
import { catchError,map, switchMap } from 'rxjs/operators';

import { clipboardCopy } from '../../../../api';
import {
  copyToClipboard,
  copyToClipboardFailed,
  copyToClipboardReset,
  copyToClipboardSuccess,
} from '../../actions';
import type { Epic} from '../../building-blocks';
import {ofType, runEpic, sharedState } from '../../building-blocks';

const copyToClipboardEpic: Epic = (actions) =>
  actions.pipe(
    ofType(copyToClipboard),
    switchMap((action) =>
      from(
        clipboardCopy({
          value: action.field.value,
        })
      ).pipe(
        map(() => copyToClipboardSuccess(action.field)),
        catchError((err) => of(copyToClipboardFailed(action.field, err)))
      )
    )
  );

runEpic(copyToClipboardEpic);

export const copyToClipboardRequest = sharedState(
  (actions) =>
    merge(
      actions.pipe(ofType(copyToClipboard)),
      actions.pipe(ofType(copyToClipboardReset)),
      actions.pipe(ofType(copyToClipboardSuccess)),
      actions.pipe(ofType(copyToClipboardFailed))
    ),
  {
    initial: copyToClipboardReset(),
  }
);
