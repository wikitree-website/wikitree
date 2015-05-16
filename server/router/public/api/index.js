'use strict';

/**
 * Public API router
 */

var express = require('express');

var authRouter = require('./auth');

module.exports = function () {
	var router = express.Router();

	router.use('/auth', authRouter());

	return router;
};