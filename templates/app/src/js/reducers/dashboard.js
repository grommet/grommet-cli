import { DASHBOARD_LOAD, DASHBOARD_UNLOAD } from '../actions';
import { createReducer } from './utils';

const initialState = {
  tasks: []
};

const handlers = {
  [DASHBOARD_LOAD]: (state, action) => {
    if (!action.error) {
      action.payload.error = undefined;
      return action.payload;
    }
    return { error: action.payload };
  },
  [DASHBOARD_UNLOAD]: () => initialState
};

export default createReducer(initialState, handlers);
