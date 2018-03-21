import { TASKS_LOAD, TASKS_UNLOAD, TASK_LOAD, TASK_UNLOAD } from '../actions';
import { createReducer } from './utils';

const initialState = {
  tasks: [],
  task: undefined
};

const handlers = {
  [TASKS_LOAD]: (state, action) => {
    if (!action.error) {
      action.payload.error = undefined;
      return action.payload;
    }
    return { error: action.payload };
  },
  [TASKS_UNLOAD]: () => initialState,
  [TASK_LOAD]: (state, action) => {
    if (!action.error) {
      action.payload.error = undefined;
      return action.payload;
    }
    return { error: action.payload };
  },
  [TASK_UNLOAD]: () => initialState
};

export default createReducer(initialState, handlers);
