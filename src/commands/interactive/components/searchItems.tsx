import React from 'react';
import { Text, Box } from 'ink';
import { ItemsList } from './itemsList';
import { VerticalLimitView } from './limitView';
import { useAppInput, useSearchItems } from '../hooks';
import { ErrorAlert } from './errorAlert';

interface IProps {
  viewportHeight: number;
}

const HEADER_HEIGHT = 3;
const FOOTER_HEIGHT = 3;

export const SearchItems: React.FC<IProps> = (props) => {
  const { isRawModeSupported } = useAppInput();
  const {
    items,
    filteredItems,
    filterText,
    offset,
    setOffset,
    cursor,
    setCursor,
    itemDetailsRequest,
  } = useSearchItems();

  const footerVisible = itemDetailsRequest.status === 'failed' ? 1 : 0;

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
              [{filterText && <Text color="white">{filterText}</Text>}
              {!filterText && (
                <Text color="gray">Start typing or copy-paste to filter</Text>
              )}
              ]
            </Text>
          </Box>
        )}
      </Box>

      <Box flexDirection="row">
        <VerticalLimitView
          itemHeight={1}
          itemCount={filteredItems.length}
          viewportHeight={
            props.viewportHeight - HEADER_HEIGHT - FOOTER_HEIGHT * footerVisible
          }
          showCursor
          offset={offset}
          setOffset={setOffset}
          cursor={cursor}
          setCursor={setCursor}
          renderCursor={(currentlyAt) => {
            if (
              itemDetailsRequest.status === 'failed' &&
              filteredItems[currentlyAt]?.uuid === itemDetailsRequest.uuid
            ) {
              return <Text color="red">{'>'}</Text>;
            }
            return <Text color="green">{'>'}</Text>;
          }}
          render={(start, end) => {
            const currentItems = React.useMemo(
              () => filteredItems.slice(start, end),
              [start, end, filteredItems]
            );
            return <ItemsList items={currentItems} highlight={filterText} />;
          }}
        />
      </Box>

      {itemDetailsRequest.status === 'failed' && (
        <Box height={2} marginTop={1} flexShrink={0}>
          <ErrorAlert error={itemDetailsRequest.error} />
        </Box>
      )}
    </React.Fragment>
  );
};
