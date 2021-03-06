import express from 'express';
import http from 'http';
import path from 'path';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import cors from 'cors';

import deserialize from '../shared/deserialize';
import template from './template';
import generateManifest from './manifest';
import {generateContext} from './context';
import project from './project';
import environment from './environment';
import registry from './registry';
import {prerender} from './prerender';
import files from './files';
import worker, {generateServiceWorker} from './worker';
import generateRobots from './robots';
import prefix from '../shared/prefix';
import printError from './printError';

if (!global.fetch) {
  global.fetch = fetch;
}

const app = express();
const server = http.createServer(app);
server.port = 5000;

for(const methodName of ['use', 'delete', 'get', 'head', 'options', 'patch', 'post', 'put']) {
  server[methodName] = function() {
    app[methodName](...arguments);
  }
}

server.start = function() {

  generateManifest();
  generateServiceWorker();
  generateRobots();

  app.use(cors(server.cors))

  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(bodyParser.text({limit: server.maximumPayloadSize}));

  app.get(`/client-${environment.key}.css`, (request, response) => {
    response.setHeader('Cache-Control', 'max-age=31536000, immutable');
    response.contentType('text/css');
    response.send(files['client.css']);
  });

  app.get(`/client-${environment.key}.js`, (request, response) => {
    response.setHeader('Cache-Control', 'max-age=31536000, immutable');
    response.contentType('text/javascript');
    response.send(files['client.js']);
  });

  app.get(`/manifest-${environment.key}.json`, (request, response) => {
    response.setHeader('Cache-Control', 'max-age=31536000, immutable');
    response.contentType('application/manifest+json');
    response.send(files['manifest.json']);
  });

  if(worker.enabled) {
    app.get(`/service-worker-${environment.key}.js`, (request, response) => {
      response.setHeader('Cache-Control', 'max-age=31536000, immutable');
      response.contentType('text/javascript');
      response.send(files['service-worker.js']);
    });
  }

  app.get('/robots.txt', (request, response) => {
    response.send(files['robots.txt']);
  });

  app.post(`/${prefix}/:hash/:methodName.json`, async (request, response) => {
    const args = deserialize(request.body);
    const {hash, methodName} = request.params;
    const [invokerHash, boundHash] = hash.split('-');
    const key = `${invokerHash}.${methodName}`;
    const invokerKlass = registry[invokerHash];
    let boundKlass = invokerKlass;
    if(boundHash) {
      boundKlass = registry[boundHash];
      if(!(boundKlass.prototype instanceof invokerKlass)) {
        return response.status(401).json({});
      }
    }
    const method = registry[key];
    if(method !== undefined) {
      try {
        const context = generateContext({request, response, ...args});
        const result = await method.call(boundKlass, context);
        response.json({result});
      } catch(error) {
        printError(error);
        response.status(500).json({});
      }
    } else {
      response.status(404).json({});
    }
  });

  app.get("*", async (request, response, next) => {
    if(request.originalUrl.split('?')[0].indexOf('.') > -1) {
      return next();
    }
    const scope = await prerender(request, response);
    if(!response.headersSent) {
      const status = scope.context.page.status;
      const html = template(scope);
      response.status(status).send(html);
    }
  });

  server.listen(server.port, () => {
    const name = project.name ? project.name : 'Nullstack'
    if(environment.development) {
      console.log('\x1b[36m%s\x1b[0m', `${name} is running in development mode at http://localhost:${server.port}`);
    } else {
      console.log('\x1b[36m%s\x1b[0m', `${name} is running in production mode at http://127.0.0.1:${server.port}`);
    }
  });

}

export default server;