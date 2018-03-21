import Main from './Main';
import Dashboard from './components/Dashboard';
import Page1 from './components/Page1';

export default {
  path: '/',
  component: Main,
  indexRoute: { component: Dashboard },
  childRoutes: [
    { path: 'page1', component: Page1 }
  ]
};
