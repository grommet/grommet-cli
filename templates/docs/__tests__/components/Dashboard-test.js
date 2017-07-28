import React from 'react';
import renderer from 'react-test-renderer';

import Dashboard from '../../src/js/components/Dashboard';

// needed because this:
// https://github.com/facebook/jest/issues/1353
jest.mock('react-dom');

test('Dashboard renders', () => {
  const component = renderer.create(
    <Dashboard />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
