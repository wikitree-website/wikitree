'use strict';

var _ = require('lodash');

/**
 * Load app configurations
 */

var env = process.env.NODE_ENV;

module.exports = _.assign(

	// settings for any environment
	{
		env: env
	},

	// settings for our current environment
	require('./' + env) || {},

	// secret settings
	require('../../../../secrets') || {},
	require('../../../../secrets/' + env) || {}

);
