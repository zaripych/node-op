import './devTools';

import { render } from 'ink';
import React from 'react';
import { defer, EMPTY, merge, switchMap } from 'rxjs';

import { loadItems, loginFailed, loginSuccess, tryLogin } from './actions';
import { dispatch, ofTypes } from './building-blocks';
import { actions } from './building-blocks/details';
import { Landing } from './components/landing';
import { log } from './hooks';

const renderApp = () =>
  render(<Landing />, {
    stdout: process.stderr,
    patchConsole: false,
  });

export const start = () => {
  let instance = renderApp();
  console.log = (...args) => {
    log(...args);
  };
  merge(
    defer(() => {
      // Try loading items:
      dispatch(loadItems());
      return EMPTY;
    }),
    // when the app is being rendered - it interferes with the "op login"
    // input, so we stop the rendering while it is in progress and then resume
    actions.pipe(
      ofTypes(tryLogin),
      switchMap(() => {
        instance.unmount();
        return EMPTY;
      })
    ),
    actions.pipe(
      ofTypes(loginFailed, loginSuccess),
      switchMap(() => {
        instance = renderApp();
        return EMPTY;
      })
    )
  ).subscribe();
};
