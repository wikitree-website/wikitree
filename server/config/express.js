'use strict';

/**
 * Express configuration
 */

var path = require('path');

var express = require('express');
var passport = require('passport');
var flash = require('connect-flash');
var morgan = require('morgan');
var helmet = require('helmet');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var favicon = require('serve-favicon');
var compress = require('compression');

var env = require('./env');
var errors = require('../lib/errors');
var router = require('../router');

module.exports = function () {
	var app = express();

	/**
	 * Middleware fiesta
	 */

	// log requests
	app.use(morgan('dev'));

	// enable gzip
	app.use(compress());

	// serve favicon
	app.use(favicon(path.resolve(
		__dirname, '..', '..', 'client/favicon.ico'
	)));

	// parse all the things
	app.use(cookieParser());
	app.use(bodyParser.json());
	app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
	app.use(bodyParser.urlencoded({ extended: true }));

	// setup ejs templating for server-side views
	app.set('view engine', 'ejs');
	app.set('views', path.resolve(__dirname, '..', 'views'));

	// express session
	app.use(session({
		secret: env.session_secret,
		saveUninitialized: true,
		resave: true
	}));

	// passport session
	app.use(passport.initialize());
	app.use(passport.session());

	// use connect flash for flash messages
	app.use(flash());

	// use helmet to secure express headers
	app.use(helmet.xframe());
	app.use(helmet.xssFilter());
	app.use(helmet.nosniff());
	app.use(helmet.ienoopen());
	app.disable('x-powered-by');

	// add custom res.json() method that namespaces with "data"
	// to globally defeat JSON Array Constructor vulnerability
	app.use(function (req, res, next) {
		res.jsond = function (data) {
			return res.json({ data: data });
		}
		return next();
	});

	// add routes
	app.use('/', router());

	// add http error handler
	app.use(errors());

	return app;
};
