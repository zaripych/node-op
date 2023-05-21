import { Box, Text } from 'ink';
import React from 'react';

import { ErrorAlert } from '../errorAlert';
import { ItemsList } from '../itemsList';
import { VerticalScrollView } from '../scrollView';
import { useSearchItemsState } from './state';

export const SearchItems: React.ComponentType = () => {
  const {
    items,
    filteredItems,
    filterText,
    itemDetailsRequest,
    onLayout,
    isRawModeSupported,
    initialOffset,
  } = useSearchItemsState();

  const contentHeightDeps = React.useMemo(
    () => [filteredItems.length],
    [filteredItems]
  );

  return (
    <React.Fragment>
      <Box flexShrink={0} marginBottom={1} flexDirection="column">
        <Box flexShrink={0}>
          <Text>
            Loaded <Text color="green">{items.length}</Text> items
            {filterText && (
              <React.Fragment>
                , <Text color="green">{filteredItems.length}</Text> items match
                the search string
              </React.Fragment>
            )}
          </Text>
        </Box>
        {isRawModeSupported && (
          <Box flexDirection="row">
            <Text color="white">Filter: </Text>
            <Text>
              {filterText && <Text color="white">{filterText}</Text>}
              {!filterText && (
                <Text color="gray">Start typing or copy-paste to filter</Text>
              )}
            </Text>
          </Box>
        )}
      </Box>

      <Box flexDirection="row">
        <VerticalScrollView
          contentHeightDeps={contentHeightDeps}
          initialOffset={initialOffset}
          onLayout={onLayout}
          disableInput={true}
        >
          <ItemsList items={filteredItems} highlight={filterText} />
        </VerticalScrollView>
      </Box>

      {itemDetailsRequest.status === 'failed' && (
        <Box height={2} marginTop={1} flexShrink={0}>
          <ErrorAlert error={itemDetailsRequest.error} />
        </Box>
      )}
    </React.Fragment>
  );
};
