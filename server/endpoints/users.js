'use strict';

var _ = require('lodash');

var errors = require('../lib/errors');

var userModel = require('../models/user');


/**
 * Endpoints
 */

// get all users
// GET domain.com/api/v1/users/
module.exports.getAll = function (req, res, next) {
	userModel.getAll()
		.then(function (users) {
			// overwrite passwords
			users.forEach(function (user) {
				user.password = undefined;
			});
			// send users
			return res.jsond({
				users: users
			});
		})
		.catch(function (err) {
			return next(
				errors.internalServerError(err)
			);
		});
};

// CRUD - read user
// GET domain.com/api/v1/users/:id
module.exports.get = function (req, res, next) {
	userModel.getById(req.params.id)
		.then(function (user) {
			if (!user) {
				// send error 404
				return next(
					errors.notFound('User not found')
				);
			}
			// overwrite password
			user.password = undefined;
			// send user
			return res.jsond({
				user: user
			});
		})
		.catch(function (err) {
			return next(
				errors.internalServerError(err)
			);
		});
};

// CRUD - create user
// POST domain.com/api/v1/users/
module.exports.create = function (req, res, next) {
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
			// this is admin only endpoint, safe to set these:
			userData.isAdmin = req.body.isAdmin;
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

// CRUD - update user
// PUT domain.com/api/v1/users/:id
module.exports.update = function (req, res, next) {
	userModel.getById(req.params.id)
		.then(function (user) {
			// user doesn't exist?
			if (!user) {
				// send error 404
				return next(
					errors.notFound('User not found')
				);
			}
			// update user data from request
			user.otherNames = req.body.otherNames || user.otherNames;
			user.lastName = req.body.lastName || user.lastName;
			user.email = req.body.email || user.email;
			if (req.body.password && req.body.password !== user.password) {
				// new password, hash it for storage
				user.password = userModel.generateHash(req.body.password);
			}
			// this is admin only endpoint, safe to set these:
			user.isAdmin = req.body.isAdmin;
			// update user in database
			userModel.update(user)
				.then(function (user) {
					// overwrite password
					user.password = undefined;
					// return updated user
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

// CRUD - delete user
// DELETE domain.com/api/v1/users/:id
module.exports.delete = function (req, res, next) {
	userModel.getById(req.params.id)
		.then(function (user) {
			// user doesn't exist?
			if (!user) {
				// send error 404
				return next(
					errors.notFound('User not found')
				);
			}
			// delete user from database
			userModel.delete(user.id)
				.then(function () {
					// overwrite password
					user.password = undefined;
					// return deleted user
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