'use strict';

var chalk =  require('chalk');

var logger = require('./log')

/**
 * Middleware - http error handler
 */
module.exports = function() {
	return function(err, req, res, next) {

		var status = err.statusCode || 500;
		var message = err.message || err.toString();
		var stack = err.stack || '';

		if (status === 500 && stack) {
			// server error, print it
			logger.error(chalk.bold.red('Error 500'));
			logger.error(stack);
		} else {
			// handled error, print it
			logger.error(chalk.bold.red('Error ' + status), message);
		}

		// send error status & json
		// error object modeled after:
		// - https://developers.facebook.com/docs/graph-api/using-graph-api/v2.2#errors
		// - https://dev.twitter.com/overview/api/response-codes
		res
			.status(status)
			.json({ error: { message: message }});

		// don't call next
		// stop express chain
	};
};


/**
 * Errors to "throw" in middleware
 * -> next(errors.errorName());
 *
 * errors modeled after HTTP status codes:
 * - https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
 * - http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
 */
module.exports.badRequest = function (msg) {
	var err = new Error(msg || 'The request could not be understood by the server');
	err.statusCode = 400;
	return err;
};
module.exports.unauthorized = function (msg) {
	var err = new Error(msg || 'Authentication is required, and has failed or not yet been provided');
	err.statusCode = 401;
	return err;
};
module.exports.forbidden = function (msg) {
	var err = new Error(msg || 'You are not authorized to perform this action on this resource');
	err.statusCode = 403;
	return err;
};
module.exports.notFound = function (msg) {
	var err = new Error(msg || 'The requested resource could not be found');
	err.statusCode = 404;
	return err;
};
module.exports.conflict = function (msg) {
	var err = new Error(msg || 'The request could not be completed due to a conflict with the current state of the resource');
	err.statusCode = 409;
	return err;
};
module.exports.internalServerError = function (msg) {
	var err = new Error(msg || 'The server encountered an unexpected condition which prevented it from fulfilling the request');
	err.statusCode = 500;
	return err;
};


/**
 * Helpers
 */

module.exports.handleSequelize = function (error, next) {
	// database error?
	if (error) {
		// send error 400
		return next(
			module.exports.badRequest('Database error: ' + JSON.stringify(error))
		);
	} else {
		// send error 500
		return next(
			module.exports.internalServerError('Database error')
		);
	}
};
