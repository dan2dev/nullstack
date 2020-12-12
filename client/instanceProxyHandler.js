import client from './client';
import deserialize from '../shared/deserialize';
import {generateContext} from './context';
import network from './network';
import worker from './worker';

const instanceProxyHandler = {
  get(target, name) {
    if(target[name] === undefined && target.constructor[name] === true) {
      return async (params) => {
        let payload;
        worker.fetching = true;
        network[name] = true;
        const url = `/api/${target.constructor.hash}/${name}.json`;
        try {
          const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(params || {})
          });
          payload = await response.text();
          worker.online = true;
        } catch(e) {
          worker.online = false;
        }
        worker.fetching = false;
        delete network[name];
        return payload ? deserialize(payload).result : undefined;
      }
    } else if(typeof(target[name]) == 'function') {
      return (args) => {
        const context = generateContext({...target._context, ...args, self: target._self});
        return target[name](context);
      }
    }
    return Reflect.get(...arguments);
  },
  set(target, name, value) {
    const result = Reflect.set(...arguments);
    if(!name.startsWith('_')) {
      client.update();
    }
    return result;
  }
}

export default instanceProxyHandler;