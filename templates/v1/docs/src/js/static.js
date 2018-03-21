import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {
  match, RouterContext, useRouterHistory
} from 'react-router';
import { createMemoryHistory } from 'history';
import template from '../template.ejs';

import routes from './routes';

export default (locals, callback) => {
  const history = useRouterHistory(createMemoryHistory)();
  const location = history.createLocation(locals.path);

  match({ routes, history, location },
    (error, redirectLocation, renderProps) => {
      callback(
        null, template({
          html: ReactDOMServer.renderToString(
            <RouterContext {...renderProps} />
          )
        })
      );
    });
};
