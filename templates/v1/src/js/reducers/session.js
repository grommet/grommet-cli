import {
  SESSION_LOAD, SESSION_LOGIN, SESSION_LOGOUT
} from '../actions';
import { createReducer } from './utils';

const initialState = {};

const handlers = {
  [SESSION_LOAD]: (state, action) => action.payload,
  [SESSION_LOGIN]: (state, action) => {
    if (!action.error) {
      return action.payload;
    }
    return { error: action.payload.message };
  },
  [SESSION_LOGOUT]: () => ({})
};

export default createReducer(initialState, handlers);
