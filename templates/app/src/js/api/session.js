import { headers, parseJSON } from './utils';

export function postSession(email, password) {
  const options = {
    headers: headers(),
    method: 'POST',
    body: JSON.stringify({ email, password })
  };

  return fetch('/api/sessions', options)
    .then(parseJSON);
}

export function deleteSession(session) {
  const options = {
    headers: headers(),
    method: 'DELETE'
  };

  return fetch(session.uri, options)
    .then(parseJSON);
}
