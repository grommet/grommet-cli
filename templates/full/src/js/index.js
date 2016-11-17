import '../scss/index.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import Main from './Main';

const body = (
  <AppContainer>
    <Main />
  </AppContainer>
);

let element = document.getElementById('content');
ReactDOM.render(body, element);

document.body.classList.remove('loading');

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./Main', () => {
    const NextApp = require('./Main').default;
    ReactDOM.render(
      <AppContainer>
        <NextApp/>
      </AppContainer>,
      element
    );
  });
}
