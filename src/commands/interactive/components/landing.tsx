import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import React from 'react';
import { startWith } from 'rxjs';

import { useSelect } from '../building-blocks';
import { dispatchAppInput } from '../hooks';
import { appState } from '../state';
import { ErrorAlert } from './errorAlert';
import { ItemDetails } from './itemDetails';
import { Keystroke } from './keystroke';
import { LogItems } from './logItems';
import { SearchItems } from './search-items';

function useLandingState() {
  dispatchAppInput();

  const [screen] = useSelect(appState.screen);
  const [itemsRequest] = useSelect(appState.itemsRequest);
  const [screenSize] = useSelect(
    () => appState.screenSize.pipe(startWith(undefined)),
    []
  );
  const [loginRequest] = useSelect(appState.loginRequest);

  return {
    itemsRequest,
    loginRequest,
    screen,
    screenSize,
  };
}

const defaultDeps = {
  useLandingState,
  SearchItems,
  ItemDetails,
  LogItems,
};

export const Landing: React.ComponentType<{
  deps?: typeof defaultDeps;
}> & { defaultDeps: typeof defaultDeps } = ({ deps = defaultDeps }) => {
  const state = deps.useLandingState();
  // we go full screen after login is successful:
  const fullScreen =
    state.loginRequest.status === 'success' ||
    state.itemsRequest.status === 'success';
  return (
    <Box flexDirection="column" {...(fullScreen ? state.screenSize : {})}>
      {state.screen === 'search' && (
        <React.Fragment>
          {state.itemsRequest.status === 'started' && (
            <Box>
              <Text color="green">
                <Spinner type="dots" />
              </Text>
              <Box marginLeft={1}>
                <Text>Loading 1-Password items</Text>
              </Box>
            </Box>
          )}
          {state.itemsRequest.status === 'failed' &&
            state.loginRequest.status !== 'failed' && (
              <Box>
                <ErrorAlert error={state.itemsRequest.error} />
              </Box>
            )}
          {state.loginRequest.status === 'failed' && (
            <Box flexDirection="column">
              <ErrorAlert error={state.loginRequest.error} />
              <Text>
                Failed to login, type your password and press{' '}
                <Keystroke value="Enter" /> to try again:{'\n'}
              </Text>
            </Box>
          )}
          {state.itemsRequest.status === 'success' &&
            state.itemsRequest.data.length === 0 && (
              <Text>1-Password vault seem to be empty</Text>
            )}
          {state.itemsRequest.status === 'success' &&
            state.itemsRequest.data.length > 0 && <deps.SearchItems />}
        </React.Fragment>
      )}
      {process.env['NODE_ENV'] === 'development' && state.screen === 'log' && (
        <deps.LogItems />
      )}
      {state.screen === 'itemDetails' && <deps.ItemDetails />}
    </Box>
  );
};
Landing.defaultDeps = defaultDeps;
