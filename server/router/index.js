'use strict';

/**
 * Main request router
 */

var path = require('path');

var express = require('express');

var publicRouter = require('./public');
var privateRouter = require('./private');

module.exports = function () {
	var router = express.Router();

	// static file requests
	// (like apache, from domain.com/)
	router.use(
		'/',
		express.static(
			path.resolve(
				__dirname,
				'..',
				'..',
				'client'
			)
		)
	);

	// public api & web requests
	router.use('/', publicRouter());

	// private api & web requests
	router.use('/', privateRouter());

	// CATCH-ALL
	// (any unhandled requests end here)
	// send them the angular app root file
	router.use(
		'*',
		function (req, res) {
			return res.sendFile(
				path.resolve(
					__dirname,
					'..',
					'..',
					'client/index.html'
				)
			);
		}
	);

	return router;
};
