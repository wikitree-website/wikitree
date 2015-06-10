'use strict';

/**
 * Private request router
 *
 * NOTE: 	all authentication checks happen here in index.js
 * 			all child files can assume authentication
 * 			but each are responsible for authorization
 */

var path = require('path');

var express = require('express');

var auth = require('../../lib/auth');
var apiRouter = require('./api');
var authRouter = require('./auth');

module.exports = function () {
	var router = express.Router();

	// domain.com/api/v1/...
	router.use('/api/v1', auth.apiRequiresLogin, apiRouter());

	// domain.com/auth/...
	router.use('/auth', auth.webRequiresLogin, authRouter());

	return router;
};
