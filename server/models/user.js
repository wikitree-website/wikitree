'use strict';

var _ = require('lodash');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');


/**
 * User model
 */

var userModel = {};
module.exports = userModel;



/**
 * Generate a hash from a password
 *
 * @return {String}		Password hash
 */
userModel.generateHash = function (password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};

/**
 * Validate a password against a hash
 *
 * @return {Boolean}		If password is valid
 */
userModel.validatePassword = function (password, hash) {
	return bcrypt.compareSync(password, hash);
};

/**
 * Get all users
 *
 * @return {Promise}	Resolves with {Array} users
 */
userModel.getAll = function () {
	return new Promise(function (resolve, reject) {

		// mongo stuff goes here

	});
};

/**
 * Get a user by id
 *
 * @param  {String} userId		ID of user
 * @return {Promise}			Resolves with {Object} user
 */
userModel.getById = function (userId) {
	return new Promise(function (resolve, reject) {

		// mongo stuff goes here

	});
};

/**
 * Get a user by email address
 *
 * @param  {String} email		Email address of user
 * @return {Promise}			Resolves with {Object} user
 */
userModel.getByEmail = function (email) {
	return new Promise(function (resolve, reject) {

		// mongo stuff goes here

	});
};

/**
 * Insert a new user
 *
 * @param  {Object} userData	User data
 * @return {Promise}			Resolves with {Object} user
 */
userModel.insert = function (userData) {
	return new Promise(function (resolve, reject) {

		// mongo stuff goes here

	});
};

/**
 * Update an existing user
 *
 * @param  {Object} user	User object
 * @return {Promise}		Resolves with {Object} user
 */
userModel.update = function (user) {
	var userId = user.id;
	delete user.id;
	return new Promise(function (resolve, reject) {

		// mongo stoof goos hooor

	});
};

/**
 * Delete a user by id
 *
 * @param  {String} userId	User id
 * @return {Promise}		Resolves with {Object} user
 */
userModel.delete = function (userId) {
	return new Promise(function (resolve, reject) {

		// mooongoooesshooorrr

	});
};