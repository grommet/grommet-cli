import 'whatwg-fetch';
import { polyfill as promisePolyfill } from 'es6-promise';

import React from 'react';
import ReactDOM from 'react-dom';

import '../scss/index.scss';

import { AppContainer } from 'react-hot-loader';
import App from './App';

promisePolyfill();

const element = document.getElementById('content');
ReactDOM.render(
  <AppContainer>
    <App />
  </AppContainer>
, element);

document.body.classList.remove('loading');

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default;
    ReactDOM.render(
      <AppContainer>
        <NextApp />
      </AppContainer>,
      element
    );
  });
}
