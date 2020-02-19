import { from, of, merge } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { clipboardCopy } from '../../../../api';
import {
  copyToClipboard,
  copyToClipboardSuccess,
  copyToClipboardFailed,
  copyToClipboardReset,
} from '../../actions';
import { runEpic, sharedState, ofType, Epic } from '../../building-blocks';

const copyToClipboardEpic: Epic = actions =>
  actions.pipe(
    ofType(copyToClipboard),
    switchMap(action =>
      from(
        clipboardCopy({
          value: action.field.value,
        })
      ).pipe(
        map(() => copyToClipboardSuccess(action.field)),
        catchError(err => of(copyToClipboardFailed(action.field, err)))
      )
    )
  );

runEpic(copyToClipboardEpic);

export const copyToClipboardRequest = sharedState(
  actions =>
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
