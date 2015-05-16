'use strict';

var _ = require('lodash-node');

/**
 * Load app configurations
 */

var env = process.env.NODE_ENV;

module.exports = _.assign(

	// settings for any environment
	{
		env: env,
	},

	// secret settings
	require('./secrets') || {},

	// settings for our current environment
	require('./' + env) || {}

);
