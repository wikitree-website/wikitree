'use strict';

var passport = require('passport');

var errors = require('../lib/errors');

var userModel = require('../models/user');


/**
 * Endpoints
 */

// currently authenticated session user, if any
// GET domain.com/api/v1/auth/current
module.exports.current = function (req, res, next) {
	// grab user from session
	var user = req.user;
	// overwrite password
	if (user && user.password) {
		user.password = undefined;
	}
	// send json
	return res.jsond({
		user: user
	});
};

// authenticate session
// POST domain.com/api/v1/auth/login
module.exports.login = function (req, res, next) {
	// authenticate user with passport
	passport.authenticate(
		'local-api',
		function (err, user, info) {
			if (err) {
				// general error
				return next(err);
			}
			// establish user session
			req.login(user, function (err) {
				if (err) {
					// general error
					return next(err);
				}
				// success! return session user
				user.password = undefined;
				return res.jsond({
					user: user
				});
			});
		}
	)(req, res, next);
};

// un-authenticate session
// POST domain.com/api/v1/auth/logout
module.exports.logout = function (req, res, next) {
	req.logout();
	return res.jsond({
		message: 'Success'
	});
};

// register new user
// POST domain.com/api/v1/auth/register
module.exports.register = function (req, res, next) {
	userModel.getByEmail(req.body.email)
		.then(function (user) {
			// user already exist?
			if (user) {
				// send error 409
				return next(
					errors.conflict('User already exists')
				);
			}
			// create user data from request
			var userData = {};
			userData.otherNames = req.body.otherNames;
			userData.lastName = req.body.lastName;
			userData.email = req.body.email;
			userData.password = userModel.generateHash(req.body.password);
			// default user to lowest-level
			userData.isAdmin = 0;
			// insert user into database
			userModel.insert(userData)
				.then(function (user) {
					// overwrite password
					user.password = undefined;
					// return new user
					return res.jsond({
						user: user
					});
				})
				.catch(function (err) {
					return next(
						errors.internalServerError(err)
					);
				});
		})
		.catch(function (err) {
			return next(
				errors.internalServerError(err)
			);
		});
};

// (web) register new user
// POST domain.com/api/v1/auth/register
module.exports.registerWeb = function (req, res, next) {
	userModel.getByEmail(req.body.email)
		.then(function (user) {
			// user already exist?
			if (user) {
				// add message & redirect to registration
				req.flash('registerMessage', 'That email is already taken.');
				return res.redirect('/auth/register');
			}
			// create user data from request
			var userData = {};
			userData.otherNames = req.body.otherNames;
			userData.lastName = req.body.lastName;
			userData.email = req.body.email;
			userData.password = userModel.generateHash(req.body.password);
			// default user to lowest-level
			userData.isAdmin = 0;
			// insert user into database
			userModel.insert(userData)
				.then(function (user) {
					// add message & redirect to registration
					req.flash('registerMessage', 'Sign up succesful, but now your account must be approved by an administrator');
					return res.redirect('/auth/register');
				})
				.catch(function (err) {
					// add message & redirect to registration
					req.flash('registerMessage', 'A system error has occurred');
					return res.redirect('/auth/register');
				});
		})
		.catch(function (err) {
			// add message & redirect to registration
			req.flash('registerMessage', 'A system error has occurred');
			return res.redirect('/auth/register');
		});
};
