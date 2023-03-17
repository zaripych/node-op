// import './devTools';
import { render } from 'ink';
import React from 'react';

import { Landing } from './components/landing';

export const start = () =>
  render(<Landing />, { experimental: true, stdout: process.stderr });
