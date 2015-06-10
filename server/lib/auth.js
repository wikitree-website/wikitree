'use strict';

var errors = require('./errors');


/**
 * Middleware for authentication & authorization
 */


// -> api request route
// require user login
module.exports.apiRequiresLogin = function(req, res, next) {

	// if request isn't authenticated
	if (!req.isAuthenticated()) {
		// send error 401
		return next(errors.unauthorized());
	}

	return next();
};

// -> web request route
// require user login
module.exports.webRequiresLogin = function(req, res, next) {

	// if request isn't authenticated
	if (!req.isAuthenticated()) {
		// redirect to public welcome
		return res.redirect('/welcome');
	}

	return next();
};


// -> api request route
// require user admin status
module.exports.apiRequiresAdmin = function(req, res, next) {

	// if request user isn't admin
	if (!req.user.isAdmin) {
		// send error 403
		return next(errors.forbidden());
	}

	return next();
};

// -> web request route
// require user admin status
module.exports.webRequiresAdmin = function(req, res, next) {

	// if request user isn't admin
	if (!req.user.isAdmin) {
		// redirect to root
		return res.redirect('/');
	}

	return next();
};
