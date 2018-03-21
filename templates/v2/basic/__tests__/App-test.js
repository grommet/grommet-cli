import React from 'react';
import renderer from 'react-test-renderer';
import 'jest-styled-components';

import App from '../src/App';

test('App renders', () => {
  const component = renderer.create(<App />);
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
