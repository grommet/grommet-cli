import React from 'react';
import renderer from 'react-test-renderer';

import App from '../../src/js/App';

test('App renders', () => {
  const component = renderer.create(
    <App />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
