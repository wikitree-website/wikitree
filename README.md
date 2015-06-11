Wikitree
===========
A web-based research tool, a visual mapping companion for your Wikipedia wanderings

[![Wikitree screenshot](http://i.imgur.com/16H2cSY.png)](https://wikitree.website/)

## Installation

Prereq: ensure you have `node`, `gulp`, and `bower` installed

Fork & clone both the main repo and the env repo (these are designed to live as sibling directories)
- Main repo: https://github.com/wikitree-website/wikitree
- Env repo: https://github.com/wikitree-website/wikitree-env

In the main repo, run: 
```
$ npm install
```
(which should also trigger `bower install`)

Then, for production, run:
```
$ gulp build
$ npm start
```

Or, for development, just run:
```
$ gulp dev
```

Congrats! In development, the app should be available on:
- [http://localhost:1111](http://localhost:1111)
- [https://localhost:2222](https://localhost:2222)



