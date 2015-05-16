'use strict';

/**
 * Public auth API router
 */

var express = require('express');

var authEndpoints = require('../../../endpoints/auth');

module.exports = function () {
	var router = express.Router();

	// current session user, if any
	router.get('/current', authEndpoints.current);

	// register, login, logout
	router.post('/register', authEndpoints.register);
	router.post('/login', authEndpoints.login);
	router.get('/logout', authEndpoints.logout);

	return router;
};