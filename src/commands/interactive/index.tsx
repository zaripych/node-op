// import './devTools';
import React from 'react';
import { render } from 'ink';
import { Landing } from './components/landing';

export const start = () =>
  render(<Landing />, { experimental: true, stdout: process.stderr });
