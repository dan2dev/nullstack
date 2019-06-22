# Nullstack
Nullstack isn't anything shiny or new. This project is a stack built on top of react, express and mongodb, using webpack to serve both the client and server environments from a single class aiming to be a seamless isomorphic way to build applications. This way the developer can focus on the logic of the application instead of tools for both environments. It's no longer necessary to think about APIs to connect frameworks in order to integrate the data and view layers, just type @server and be happy.

## Installation

```sh
$ npm install -g nullstack
```

## Generating the application

The following command will initialize the project with the required structure structure and install the dependencies:

```sh
$ nullstack new ProjectName
```

The project folder will give you access to the following commands in your terminal:

```sh
$ nullstack server
```
compiles your server code into the build folder and watches for changes, the server will be available at the defined port

```sh
$ nullstack client
```
compiles your client code and styles into the build folder and watches for changes

```sh
$ nullstack
```
the combination of both commands above running in a single terminal in parallel, this is the command you will use most of your development time

```sh
$ nullstack dist
```
Prepares your code for production and pastes the result in the dist folder

```sh
$ nullstack generate page PageName
```
Generates a new page skeleton and imports it into index.js and routes it


## Project structure

The project consists of the following folders:

* **dist** Contais the code that is compiled for production, this folder must be deployed to the production server
* **uploads** This is the default file for uploading content generated by the end users. Everything in this folder is acessible with the /uploads url prefix in the browser. This folder must be created empty in the production server
* **public** Contains static files created by the developer like images and manifests. Everything in this folder is acessible by filename without prefix in the browser. This folder must be copied to the production server
* **build** This is the compiled code for local development
* **src** This is the most important folder, containing the source code of the application and the index.js file

## Index.js

This file gives an overview of your application for newcomers consisting of both the entrypoint for your server and where routes and configs live

### routes
routes define how the Page subclasses you create will connect to the urls in the browser, its recomended to choose meaningfull names that match the url visited.

```js
// importing the function from nullstack
import {route} from 'nullstack';

// importing a class you created from the src file and assigning as the application root and a named url, you can route a class as many times as you want to different paths
import Books from './books';
route('/', Books);
route('/books', Books);

// importing a class you created and assigning to a url with params which will be received as props in your class instance
import Book from './book';
route('/books/:id', Book);

// importing a class you created and assigning as a wildcard route wich will catch all urls that doesent match any of the previous routes
import NotFound from './not-found';
route('*', NotFound);
```

### configs

Manage your application environment with the following configs:

```js
// importing the function from nullstack
import {config} from 'nullstack';

// configure your database using mongodb, these configs will be compiled only to the server code and removed from the client code
config('database.url', 'mongodb://localhost:27017');
config('database.name', 'mydatabasename');

// your session secret
config('session.secret', 'awy9edc67y012c37h123');

// the port that will run the express server
config('server.port', 21121);

// these are SEO defaults that will be used for prerendering the header of each page if not overwriten
config('default.description', 'Descrição');
config('default.project', 'Awsome Project Name');
config('default.path', '/');
config('default.image', 'http://placehold.it/400x400');
config('default.domain', 'yourdomain.com');
config('default.protocol', 'https');
config('default.locale', 'pt_BR');
config('default.type', 'website');
```

### ready

This function starts your code on server and client, making your application available to be served

```js
// importing the function from nullstack
import {ready} from 'nullstack';
ready();
```

## Creating a page

You can think as pages in nullstack as top level react components, each page can be (but dont have to) be composed of multiple components. A page class contains the full lifecycle from the initial request to the html representation of your content, to the user interactions of your elements

the Page class is essentialy a subclass of react component with custom hooks that will run a copy on the server and one in the client.

```js
// src/book.js

// its important to import React from nullstack, since the views are rendered as JSX
import {Page, React} from 'nullstack';

export default class Book extends Page {

  render() {
    return (
      <div>  Hello world, im the book page! </div>
    )
  }

}
```

### State and Props
In nullstack state is treated just like in react, but with the difference that the server will have a copy of the state in sync. Props are received from the url containing the params and query params, you can also declare default values for each of them.

```js
// src/hello.js visited from the route /hello/:shift
import {Page, React} from 'nullstack';

export default class Book extends Page {

  static defaultProps = {
    shift: 'morning'
  }

  state = {
    name: 'Guest',
  }

  updateName(name) {
    this.setSate({name});
  }

  render() {
    return (
      <div>
        <div>  Good {this.props.shift} {this.state.name} </div>
        <input
          placeholder="Whats your name?"
          value={this.state.name}
          onChange={(e) => this.updateName(e.target.value)}
        />
      </div>
    )
  }

}
```

### running code on the server
running code on the server is as simple as decorating a method with @server, this will assure that the function is not compiled to the client code but instead replaced at compile time for a call to the server invoking that function with a copy of the current state and props of the instance that called it

```js
// src/counter.js
// import the server decorator from nullstack
import {server, Page, React} from 'nullstack';

export default class Counter extends Page {

  state = {
    serverCount: 0,
    clientCount: 0
  }

  @server
  incrementOnServer() {
    const serverCount = this.state.serverCount + 1;
    this.setState({serverCount});
  }

  incrementOnClient() {
    const clientCount = this.state.clientCount + 1;
    this.setState({clientCount});
  }

  render() {
    return (
      <div>  
        <p> these button have been clicked {this.state.serverCount} on server and {this.state.clientCount} on client </p>
        <button onClick={() => this.incrementOnServer()}> Click me </button>
        <button onClick={() => this.incrementOnClient()}> Click me </button>
      </div>
    )
  }

}
```

The switch between environments is seamless and will act as if the developer was in his regular programing flow, the return from server called functions will be available in the client. Use async/await to hide the switching behaviour

```js
// src/counter.js
// import the server decorator from nullstack
import {server, Page, React} from 'nullstack';

export default class NumberGenerator extends Page {

  state = {
    number: 0
  }

  @server
  async generateRandonNumber(min, max) {
    const number = Math.random() * (max-min) + min;
    this.setState({number});
    return number;
  }

  generateRandonNumberAndMultiplyBy(multiplier) {
    const randonNumber = async this.generateRandonNumber();
    const number = randonNumber * multiplier;
    this.setState({number});
  }

  render() {
    return (
      <div>  
        <p> your lucky number is {this.state.number} </p>
        <button onClick={() => this.generateRandonNumber(0, 10)}> Generate number on server </button>
        <button onClick={() => this.generateRandonNumberAndMultiplyBy(3)}> Click me </button>
      </div>
    )
  }

}
```

**note:** If you call a client function from the server, it will run in the server instead of switching environments again, and only once the server function is done it will make the switch.

## Lifecycle

every page can implement a historyDidUpdate hook, which will be triggered everytime the url is visited or params are changed, in this method you can overwrite any of the SEO defaults

```js
// src/hello.js
import {Page, React} from 'nullstack';

export default class HelloWorld extends Page {

  historyDidUpdate() {
    this.set({title: 'Im a title!', description: 'Im a description!'});
  }

  render() {
    ///...
  }

}
```

The method above will be ran on the client only if you transition into this page, but if you hit this page in the first time you access the app it will run in the server. If you wanna force this hook to be always run in the server, you can decorate it

```js
// src/hello.js
import {server, Page, React} from 'nullstack';

export default class HelloWorld extends Page {

  @server
  async historyDidUpdate() {
    this.set({title: 'Im a title!', description: 'Im a description!'});
  }

  render() {
    ///...
  }

}
```

## Redirecting

Every url starting with a forward slash will be considered a transition and will not reload the full application, instead it will render the target page.
You can also programatically redirect to a link using this.redirect as in the example bellow.

```js
// src/hello.js
import {server, Page, React} from 'nullstack';

export default class HelloWorld extends Page {

  transitionToTheOtherPage() {
    this.redirect('/other-page');
  }

  render() {
    return (
      <a href="/other-page"> I am a link </a>
      <button onClick={() => this.transitionToTheOtherPage()}> I identify as a link </button>
    )
  }

}
```

## Working with sessions
Sessions are stored in the database and are availabe on server decorated methods. If you wanna expose the session to the client, consider adding the variable to the state individually in order to whitelist it. The api for getting and setting sessions is similar to the state handling api and accepts any serializable object.

```js
// src/hello.js
import {server, Page, React} from 'nullstack';

export default class HelloWorld extends Page {

  state = {
    visitCounter: 0
  }

  @server
  async historyDidUpdate() {
    const visitCounter = (this.session.visitCounter || 0) + 1;
    this.setSession({visitCounter});
    this.setState({visitCounter});
  }

  render() {
    return (
      <p> You visited this page {this.state.visitCounter} times! </p>
    )
  }

}
```


## Working with the database
Every instance of Page subclasses have a database property exposed that can be used on server decorated methods. The database property is a mongodb connection that can be chained with a collection.

```js
// src/book.js with a route /books/:slug
import {server, Page, React} from 'nullstack';

export default class Book extends Page {

  state = {
    book: {}
  }

  @server
  async historyDidUpdate() {
    const book = await this.database.collection('books').findOne({slug: this.props.slug});
    this.setState({book});
    this.set({title: book.title});
  }

  render() {
    return (
      <h1> {this.state.book.title} </h1>
      <div> {this.state.book.summary} </div>
    )
  }

}
```

## Working with the storage
Every instance of Page subclasses have a storage property exposed that can be used on server decorated methods. The storage property defaults to saving files on disk on a folder named uploads. The api to storage is very similar to mongodb. Objects from file inputs can be used as server function arguments seamlessly and will result in a multipart submit to the server out of the box. Files inserted without name will generate a randon uuid. Extension will be defined by the mimetype and not the original file extension for safety reasons. Inserting an image returns its relative URL.

```js
// src/book.js with a route /books/:slug
import {server, Page, React} from 'nullstack';

export default class AdminBook extends Page {

    state = {
      book: {}
    }

    @server
    async uploadBookCover(file, name) {
      if(!this.session.admin) return this.redirect('/login');
      const url = await this.storage.collection('books').insertOne({
        ...file,
        name: name
      });
      const book = {...this.state.book};
      book.cover = url;
      this.setState({book});
    }

    render() {
      return (
        <div>
          <input type="file" onChange={(e) => {this.uploadBookCover(e.target.files[0], 'cover')}} />
          {this.state.book.cover && <img src={this.state.book.cover} />}
        </div>
      )
    }

}
```

```js
// src/book.js with a route /books/:slug
import {server, Page, React} from 'nullstack';

export default class AdminBook extends Page {

    state = {
      book: {}
    }

    @server
    async uploadBookCover(file) {
      if(!this.session.admin) return this.redirect('/login');
      const large = await this.storage.collection('books').insertOne({...file, width: 1280, quality: 90});
      const medium = await this.storage.collection('books').insertOne({...file, height: 720, quality: 90});
      const small = await this.storage.collection('books').insertOne({...file, height: 400, quality: 95});
      const book = {...this.state.book};
      book.cover = {large, medium, small};
      this.setState({book});
    }

    render() {
      return (
        <div>
          <input type="file" onChange={(e) => {this.uploadBookCover(e.target.files[0])}} />
          {this.state.book.cover && <img src={this.state.book.cover} />}
        </div>
      )
    }

}
```

When working with images there are some extra options that you can add to the file. Changing only width or height will set the other one to auto. Setting a quality will convert it to jpeg automatically

## Prerender

Prerendering comes out of the box with Nullstack.
Since everything is just one class, Nullstack has the advantage of not needing to fetch for api calls when prerendering, instead it just uses the functions locally saving resources and increasing the response time for search engines!
In the first request HTML will be served and the SPA will take over but with the advantage of not needing a second fetch to get the initial state from the server, the state will be assumed from the html that was served. The next requests will transition with only calls for new data and not templates as in a normal SPA.

## Deploy

First you have to run the following command to prepare the distribution build containing all the dependencies and your source code in a webpack compiled file:
```sh
$ npm run dist
```

Then you are in charge of manually or programatically sending the contents of the folders following folders to the server
* dist
* uploads
* public

In order to start the node application you have to call the entrypoint which is dist/server.js on your server.
The simplest possible way to run it is:
```sh
$ node dist/server.js
```