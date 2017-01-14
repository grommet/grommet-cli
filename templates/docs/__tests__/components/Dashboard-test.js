import React from 'react';
import renderer from 'react-test-renderer';

import Dashboard from '../../src/js/components/Dashboard';

test('Dashboard renders', () => {
  const component = renderer.create(
    <Dashboard />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
