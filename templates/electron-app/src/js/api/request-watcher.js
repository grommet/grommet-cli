import { headers, parseJSON } from './utils';

function _getRequest(request) {
  if (!request.pollBusy) {
    request.pollBusy = true;

    const options = { method: 'GET', headers: headers() };
    fetch(request.uri, options)
      .then(parseJSON)
      .then(request.success)
      .catch(error => request.error({
        statusCode: error.status, message: error.statusText
      }))
      .then(() => request.pollBusy = false);
  }
}

const wsRegex = (
  /^(wss?):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?$/i
);

export default class RequestWatcher {

  constructor(options = {}) {
    this._options = Object.assign({
      reconnectTimeout: 5000, // 5s
      pollTimeout: 5000, // 5s
      pingTimeout: 30000 // 30s,
    }, options);
    this._requests = [];
    this._nextRequestId = 1;
    if (this._options.webSocketUrl) {
      if (!wsRegex.test(this._options.webSocketUrl)) {
        throw new Error('Option webSocketUrl is not a valid socket url');
      }
      if (!('WebSocket' in window || 'MozWebSocket' in window)) {
        console.warn(
          'WebSocket not available in this browser, will fall back to polling'
        );
      } else {
        this._initialize();
      }
    }
  }

  _initialize() {
    this._ws = new WebSocket(this._options.webSocketUrl);
    this._ws.onopen = this._onOpen.bind(this);
    this._ws.onerror = this._onError.bind(this);
    this._ws.onmessage = this._onMessage.bind(this);
    this._ws.onclose = this._onClose.bind(this);
  }

  _onError() {
    this._requests.forEach(request => request.error({
      statusCode: 500,
      message: 'Failed to connect with server'
    }));
  }

  _onClose() {
    // lost connection, retry in a bit
    this._ws = undefined;
    clearInterval(this._pingTimer);
    this._pollTimer = setTimeout(
      this._initialize.bind(this), this._options.reconnectTimeout
    );
  }

  _onMessage(event) {
    const message = JSON.parse(event.data);
    // Figure out which message this corresponds to so we
    // know which action to deliver the response with.
    this._requests.some((request) => {
      if (request.id === message.id) {
        if (message.op === 'error') {
          request.error(message.error);
        } else {
          request.success(message.result);
        }
        return true;
      }
      return false;
    });
  }

  _sendMessage(op, id, uri) {
    if (this._ws) {
      const { Auth } = headers();
      this._ws.send(JSON.stringify({ op, id, uri, Auth }));
    }
  }

  _onOpen() {
    this._wsReady = true;
    // send any requests we have queued up
    this._requests.forEach(request => this._sendMessage(
      'start', request.id, request.uri
    ));
    // stop polling
    clearInterval(this._pollTimer);
    // start pinging
    clearInterval(this._pingTimer);
    this._pingTimer = setInterval(
      this._ping.bind(this), this._options.pingTimeout
    );
  }

  _ping() {
    this._sendMessage('ping');
  }

  _poll() {
    this._requests.forEach(_getRequest);
  }

  watch(uri) {
    const request = {
      id: this._nextRequestId++,
      uri
    };
    this._requests.push(request);
    const watcher = {
      on(result, cb) {
        if (result === 'success') {
          request.success = cb;
        } else if (result === 'error') {
          request.error = cb;
        }
        return watcher;
      },
      start: function start() {
        if (this._wsReady) {
          this._sendMessage('start', request.id, request.uri);
        } else {
          // The web socket isn't ready yet, and might never be.
          // Proceed in polling mode until the web socket is ready.
          _getRequest(request);
          if (!this._pollTimer) {
            this._pollTimer = setInterval(
              this._poll.bind(this), this._options.pollTimeout
            );
          }
        }
        return watcher;
      }.bind(this),
      stop: function stop() {
        this._requests = this._requests.filter((req) => {
          if (req.id === request.id) {
            if (this._wsReady) {
              this._sendMessage('stop', req.id);
            } else if (this._requests.length === 1) {
              // stop polling if request list is empty
              clearInterval(this._pollTimer);
              this._pollTimer = undefined;
            }
          }
          return (req.id !== request.id);
        });

        return watcher;
      }.bind(this)
    };

    return watcher;
  }
}
