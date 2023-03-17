import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import React from 'react';
import { of } from 'rxjs';

import { loadItems } from '../actions';
import { useEpicWhenMounted,useSelect } from '../building-blocks';
import { dispatchAppInput } from '../hooks';
import { appState } from '../state';
import { ErrorAlert } from './errorAlert';
import { ItemDetails } from './itemDetails';
import { LogItems } from './logItems';
import { SearchItems } from './searchItems';

function useLandingState() {
  dispatchAppInput();

  const [screen] = useSelect(appState.screen);
  const [itemsRequest] = useSelect(appState.itemsRequest);

  useEpicWhenMounted(() => of(loadItems()));

  return {
    itemsRequest,
    screen,
  };
}

function screenSize() {
  return {
    height:
      typeof process.stderr.rows === 'number' ? process.stderr.rows - 1 : 40,
    width:
      typeof process.stderr.columns === 'number' ? process.stderr.columns : 80,
  };
}

export const Landing: React.FC = () => {
  const state = useLandingState();
  const screenSz = screenSize();
  return (
    <Box flexDirection="column" {...screenSz}>
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
          {state.itemsRequest.status === 'failed' && (
            <Box>
              <ErrorAlert error={state.itemsRequest.error} />
            </Box>
          )}
          {state.itemsRequest.status === 'success' && (
            <SearchItems viewportHeight={screenSz.height - 1} />
          )}
        </React.Fragment>
      )}
      {state.screen === 'log' && (
        <LogItems viewportHeight={screenSz.height - 1} />
      )}
      {state.screen === 'itemDetails' && (
        <ItemDetails
          viewportWidth={screenSz.width}
          viewportHeight={screenSz.height - 1}
        />
      )}
    </Box>
  );
};
