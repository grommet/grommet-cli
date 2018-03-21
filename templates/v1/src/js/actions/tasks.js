import { TASKS_LOAD, TASKS_UNLOAD, TASK_LOAD, TASK_UNLOAD } from '../actions';
import {
  watchTasks, unwatchTasks, watchTask, unwatchTask
} from '../api/tasks';

export function loadTasks() {
  return dispatch => (
    watchTasks()
      .on('success',
        payload => dispatch({ type: TASKS_LOAD, payload })
      )
      .on('error',
        payload => dispatch({ type: TASKS_LOAD, error: true, payload })
      )
      .start()
  );
}

export function unloadTasks() {
  unwatchTasks();
  return { type: TASKS_UNLOAD };
}

export function loadTask(id) {
  return dispatch => (
    watchTask(id)
      .on('success',
        payload => dispatch({ type: TASK_LOAD, payload })
      )
      .on('error',
        payload => dispatch({ type: TASK_LOAD, error: true, payload })
      )
      .start()
  );
}

export function unloadTask(id) {
  unwatchTask(id);
  return { type: TASK_UNLOAD };
}
