import ws from 'ws';
import pathToRegexp from 'path-to-regexp';

function parseQuery(string) {
  const params = string.split('&');
  const result = {};
  params.forEach((param) => {
    const parts = param.split('=');
    // if we already have this parameter, it must be an array
    if (result[parts[0]]) {
      if (!Array.isArray(result[parts[0]])) {
        result[parts[0]] = [result[parts[0]]];
      }
      result[parts[0]].push(decodeURIComponent(parts[1]));
    } else {
      result[parts[0]] = decodeURIComponent(parts[1]);
    }
  });
  return result;
}

class Connection {

  constructor(socket, routes) {
    this._requests = [];
    this._socket = socket;
    this._routes = routes;
    this._listeners = {};

    this._socket.on('message', this._onMessage.bind(this));
    this._socket.on('close', this.close.bind(this));
  }

  _validate(request) {
    // gets all routes and check if there is a match
    return this._routes.some((route) => {
      const params = [];
      // params will be populated by pathToRegexp with the dynamic portios of
      // the route
      const pathRegexp = pathToRegexp(route.path, params);
      // path needs to be a valid express route
      if (pathRegexp.test(request.uri)) {
        if (params.length > 0) {
          // grap the param values for the dynamic URL
          const groups = pathRegexp.exec(request.uri);
          params.forEach((param, index) => {
            // the resulting group has index 0 as the entire expression
            // this is why we have to increment index by 1
            request.params[param.name] = groups[index + 1];
          });
        }
        // add the route path to the request so that we can easily
        // reference which route was used for this request
        request.path = route.path;
        return true;
      }
      return false;
    });
  }

  _onMessage(message) {
    const request = JSON.parse(message);
    if (request.op === 'start') {
      // Split out query parameters
      const parts = request.uri.split('?');
      request.uri = parts[0];
      if (parts[1]) {
        request.params = parseQuery(parts[1]);
      } else {
        request.params = [];
      }
      if (this._validate(request)) {
        this._requests.push(request);
        this._exec(request);
      } else {
        this._socket.send({
          error: { statusCode: 404, message: `unknown uri ${request.uri}` }
        });
      }
    } else if (request.op === 'stop') {
      this._requests = this._requests.filter(req => req.id !== request.id);
    } else if (request.op === 'ping') {
      this._socket.send(JSON.stringify({ op: 'ping' }));
    } else {
      this._socket.send({
        error: { statusCode: 404, message: `unknown op ${request.op}` }
      });
      this.close();
    }
  }

  _exec(request) {
    // stop after the first matching route
    this._routes.some((route) => {
      if (request.path === route.path) {
        const socket = this._socket;
        route.cb(request.params)
          .then((result) => {
            socket.send(
              JSON.stringify({ op: 'update', id: request.id, result })
            );
          })
          .catch(error => (
            socket.send(
              JSON.stringify({ op: 'error', id: request.id, error })
            )
          ));
        return true;
      }
      return false;
    }, this);
  }

  close() {
    if (this._socket) {
      this._socket.close();
      this._socket = undefined;
    }
    // notify possible listeners on the connection close event
    if (this._listeners.close) {
      this._listeners.close();
    }
  }

  test(cb) {
    if (this._socket) {
      this._requests.forEach((request) => {
        if (cb(request)) {
          this._exec(request);
        }
      }, this);
    }
  }

  on(event, cb) {
    if (event === 'close') {
      this._listeners[event] = cb;
    }
  }
}

export default class Notifier {

  constructor() {
    this._connections = [];
    this._routes = [];
    this._notifyListeners = [];
  }

  _onConnection(socket) {
    const connections = this._connections;
    const connection = new Connection(socket, this._routes);
    connections.push(connection);
    connection.on('close', () => {
      const index = connections.indexOf(connection);
      if (index) {
        connections.splice(index, 1);
      }
    });
  }

  listen(server) {
    this._wsServer = new ws.Server({ server });
    this._wsServer.on('connection', this._onConnection.bind(this));
  }

  use(path, cb) {
    if (!this._wsServer) {
      this._routes.push({ path, cb });
    } else {
      console.error('Cannot add listener to Notifier after listen is active.');
    }
  }

  test(cb) {
    this._connections.forEach(
      connection => connection.test(cb)
    );
  }
}
