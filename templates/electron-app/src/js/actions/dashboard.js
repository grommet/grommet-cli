import { DASHBOARD_LOAD, DASHBOARD_UNLOAD } from '../actions';
import { watchDashboard, unwatchDashboard } from '../api/dashboard';

export function loadDashboard() {
  return dispatch => (
    watchDashboard()
      .on('success',
        payload => dispatch({ type: DASHBOARD_LOAD, payload })
      )
      .on('error',
        payload => dispatch({ type: DASHBOARD_LOAD, error: true, payload })
      )
      .start()
  );
}

export function unloadDashboard() {
  unwatchDashboard();
  return { type: DASHBOARD_UNLOAD };
}
