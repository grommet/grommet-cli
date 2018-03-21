import React from 'react';
import renderer from 'react-test-renderer';
import { Provider } from 'react-redux';
import { Router } from 'react-router';

import createMemoryHistory from 'history/createMemoryHistory';

import NavSidebar from '../../src/js/components/NavSidebar';
import store from '../../src/js/store';

const history = createMemoryHistory('/');

const routes = [{
  path: '/',
  component: () => <NavSidebar />
}];

// needed because this:
// https://github.com/facebook/jest/issues/1353
jest.mock('react-dom');

test('NavSidebar renders', () => {
  const component = renderer.create(
    <Provider store={store}>
      <Router routes={routes} history={history} />
    </Provider>
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
