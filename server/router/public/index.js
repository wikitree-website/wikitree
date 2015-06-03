'use strict';

/**
 * Public request router
 */

var express = require('express');

var apiRouter = require('./api');
var authRouter = require('./auth');

module.exports = function () {
	var router = express.Router();

	// public welcome page
	//router.get('/welcome', function (req, res) {
	//	if (req.isAuthenticated()) {
	//		// already logged in? redirect to root
	//		return res.redirect('/');
	//	} else {
	//		// load welcome page
	//		return res.render('welcome.ejs');
	//	}
	//});

	// domain.com/api/v1/...
	router.use('/api/v1', apiRouter());

	// domain.com/auth/...
	router.use('/auth', authRouter());

	return router;
};