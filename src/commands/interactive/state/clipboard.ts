import { from, merge, of } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';

import { clipboardCopy } from '../../../api';
import {
  copyToClipboard,
  copyToClipboardFailed,
  copyToClipboardReset,
  copyToClipboardSuccess,
} from '../actions';
import type { Epic } from '../building-blocks';
import { ofTypes } from '../building-blocks';
import { ofType, runEpic, sharedState } from '../building-blocks';
import { itemDetailsOtpStatus } from './itemDetails';

const copyToClipboardEpic: Epic = (actions) =>
  actions.pipe(
    ofType(copyToClipboard),
    withLatestFrom(itemDetailsOtpStatus),
    switchMap(([action, otpStatus]) => {
      const otpField = otpStatus[action.field.value];
      return from(
        clipboardCopy({
          value: otpField ? otpField.token : action.field.value,
        })
      ).pipe(
        map(() => copyToClipboardSuccess(action.field)),
        catchError((err) => of(copyToClipboardFailed(action.field, err)))
      );
    })
  );

runEpic(copyToClipboardEpic);

export const copyToClipboardRequest = sharedState(
  (actions) =>
    merge(
      actions.pipe(
        ofTypes(
          copyToClipboard,
          copyToClipboardReset,
          copyToClipboardSuccess,
          copyToClipboardFailed
        )
      )
    ),
  {
    initial: copyToClipboardReset(),
  }
);
