import RequestWatcher from './request-watcher';

let protocol = 'ws:';
if (window.location.protocol === 'https:') {
  protocol = 'wss:';
}
const host = 'localhost:8102'; 
const webSocketUrl = `${protocol}//${host}`;

const socketWatcher = new RequestWatcher({ webSocketUrl });

let tasksWatcher;

export function watchTasks() {
  tasksWatcher = socketWatcher.watch('/api/task');
  return tasksWatcher;
}

export function unwatchTasks() {
  if (tasksWatcher) {
    tasksWatcher.stop();
  }
}

const taskWatcher = {};

export function watchTask(id) {
  taskWatcher[id] = socketWatcher.watch(`/api/task/${id}`);
  return taskWatcher[id];
}

export function unwatchTask(id) {
  if (taskWatcher[id]) {
    taskWatcher[id].stop();
  }
}
