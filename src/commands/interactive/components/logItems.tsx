import { Box, Text } from 'ink';
import React from 'react';

import { useLog } from '../hooks/log';
import { Keystroke } from './keystroke';
import { VerticalScrollView } from './scrollView';

export const LogItems: React.ComponentType = () => {
  const { lines } = useLog();

  return (
    <Box flexDirection="column">
      <Box flexShrink={0}>
        <Text>
          This is an internal log of the application, you can switch back to
          search view by pressing <Keystroke value="Ctrl+L" /> again, or{' '}
          <Keystroke value="Ctrl+C" /> to quit
        </Text>
      </Box>
      <VerticalScrollView>
        <Text>{lines.join('\n')}</Text>
      </VerticalScrollView>
    </Box>
  );
};
