import { TOTP, URI } from 'otpauth';
import { defer, EMPTY, from, interval, merge, of } from 'rxjs';
import {
  catchError,
  filter,
  map,
  mergeMap,
  scan,
  skip,
  switchMap,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators';

import { getItem } from '../../../api';
import {
  loadItemDetails,
  loadItemDetailsFailed,
  loadItemDetailsReset,
  loadItemDetailsSuccess,
} from '../actions';
import {
  loadItemOtp,
  loadItemOtpFailed,
  loadItemOtpSuccess,
} from '../actions/loadItemOtp';
import type { Epic } from '../building-blocks';
import { isTruthy } from '../building-blocks';
import { ofTypes } from '../building-blocks';
import { ofType, runEpic, sharedState } from '../building-blocks';
import { redact } from './redact.conditional';
import { screen } from './screen';
import type {
  UiItemDetails,
  UiItemDetailsField,
  UiItemDetailsOtpField,
} from './types';
import { mapItemDetails } from './types';
import { vault } from './vault';

const maybeRedactField = (field: UiItemDetailsField) => ({
  ...field,
  value: redact(field.value, field.concealed),
});

const maybeRedact = (item: UiItemDetails) => ({
  ...item,
  fields: item.fields.map(maybeRedactField),
});

const loadItemDetailsEpic: Epic = (actions) =>
  actions.pipe(
    ofType(loadItemDetails),
    withLatestFrom(vault),
    switchMap(([action, currentVault]) =>
      from(
        getItem({
          uuid: action.uuid,
          vault: currentVault,
          verbosity: 0,
        })
      ).pipe(
        map((details) =>
          loadItemDetailsSuccess(
            action.uuid,
            maybeRedact(mapItemDetails(details))
          )
        ),
        catchError((err) => of(loadItemDetailsFailed(action.uuid, err)))
      )
    )
  );

runEpic(loadItemDetailsEpic);

const loadItemOtpEpic: Epic = (actions) =>
  actions.pipe(
    ofType(loadItemOtp),
    switchMap((action) =>
      defer(() => {
        const otp = URI.parse(action.otp);
        if (otp instanceof TOTP) {
          //
          return merge(of(undefined), interval(otp.period * 1000)).pipe(
            switchMap(() => {
              const token = redact(otp.generate());

              return merge(of(undefined), interval(1000)).pipe(
                mergeMap((_, i) =>
                  of(loadItemOtpSuccess(action.otp, token, otp.period - i))
                )
              );
            })
          );
        } else {
          return of(loadItemOtpSuccess(action.otp, otp.generate()));
        }
      }).pipe(
        takeUntil(
          screen.pipe(
            skip(1),
            filter((screen) => screen !== 'itemDetails')
          )
        ),
        catchError((err) => of(loadItemOtpFailed(action.otp, err)))
      )
    )
  );

runEpic(loadItemOtpEpic);

export const itemDetailsRequest = sharedState(
  (actions) =>
    actions.pipe(
      ofTypes(
        loadItemDetailsReset,
        loadItemDetails,
        loadItemDetailsSuccess,
        loadItemDetailsFailed
      )
    ),
  {
    initial: loadItemDetailsReset(),
  }
);

export const itemDetailsOtpStatus = sharedState(
  (actions) =>
    itemDetailsRequest.pipe(
      switchMap(() =>
        // when request status changes - we reset the state
        actions.pipe(
          ofType(loadItemOtpSuccess),
          switchMap((action) => {
            if (!action.expiresInSeconds) {
              return EMPTY;
            }
            return of({
              expiresInSeconds: action.expiresInSeconds,
              otp: action.otp,
              token: action.token,
            });
          }),
          scan((acc, data) => [...acc, data], [] as UiItemDetailsOtpField[]),
          map((fields) =>
            Object.fromEntries(fields.map((field) => [field.otp, field]))
          )
        )
      )
    ),
  {
    initial: {} as Record<string, UiItemDetailsOtpField>,
  }
);

export const itemDetails = sharedState(
  (actions) =>
    actions.pipe(
      ofType(loadItemDetailsSuccess),
      map((action) => action.data)
    ),
  {
    initial: undefined,
  }
);

const loadItemOtpOnItemDetailsEpic: Epic = () =>
  itemDetails.pipe(
    filter(isTruthy),
    switchMap((details) =>
      from(
        details.fields
          .filter((field) => field.value.startsWith('otpauth://totp'))
          .map((field) => loadItemOtp(field.value))
      )
    )
  );

runEpic(loadItemOtpOnItemDetailsEpic);
