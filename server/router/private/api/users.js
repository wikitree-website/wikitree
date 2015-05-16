'use strict';

/**
 * Private users API router
 */

var express = require('express');

var auth = require('../../../lib/auth');

var userEndpoints = require('../../../endpoints/users');


module.exports = function () {
	var router = express.Router();

	// user CRUD
	router.post('/', auth.apiRequiresAdmin, userEndpoints.create);
	router.get('/:id', auth.apiRequiresAdmin, userEndpoints.get);
	router.put('/:id', auth.apiRequiresAdmin, userEndpoints.update);
	router.delete('/:id', auth.apiRequiresAdmin, userEndpoints.delete);

	// all users
	router.get('/', auth.apiRequiresAdmin, userEndpoints.getAll);

	return router;
};