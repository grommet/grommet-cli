import { SESSION_LOAD, SESSION_LOGIN, SESSION_LOGOUT } from '../actions';
import { deleteSession, postSession } from '../api/session';
import { updateHeaders } from '../api/utils';

const localStorage = window.localStorage;

export function initialize() {
  return (dispatch) => {
    const { email, name, token } = localStorage;
    if (email && token) {
      dispatch({
        type: SESSION_LOAD, payload: { email, name, token }
      });
    } else {
      window.location = '/login';
    }
  };
}

export function login(email, password, done) {
  return dispatch => (
    postSession(email, password)
      .then((payload) => {
        updateHeaders({ Auth: payload.token });
        dispatch({ type: SESSION_LOGIN, payload });
        try {
          localStorage.email = payload.email;
          localStorage.name = payload.name;
          localStorage.token = payload.token;
        } catch (e) {
          alert(
            'Unable to preserve session, probably due to being in private ' +
            'browsing mode.'
          );
        }
        done();
      })
      .catch(payload => dispatch({
        type: SESSION_LOGIN,
        error: true,
        payload: {
          statusCode: payload.status, message: payload.statusText
        }
      }))
  );
}

export function logout(session) {
  return (dispatch) => {
    dispatch({ type: SESSION_LOGOUT });
    deleteSession(session);
    updateHeaders({ Auth: undefined });
    try {
      localStorage.removeItem('email');
      localStorage.removeItem('name');
      localStorage.removeItem('token');
    } catch (e) {
      // ignore
    }
    window.location.href = '/login'; // reload fully
  };
}
