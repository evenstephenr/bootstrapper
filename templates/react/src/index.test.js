import React from 'react';
import {render} from '@testing-library/react'

import '@testing-library/jest-dom'

import {Greeting} from './';

test('should pass', () => {
  expect(1 === 1).toEqual(true);
  expect (1 === 2).toEqual(false);
  const { getByText } = render(<Greeting />);
  expect(getByText('Hello, world!')).toBeInTheDocument();
});
