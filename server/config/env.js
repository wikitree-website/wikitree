'use strict';

var path = require('path');

var logger = require('../lib/log');

/**
 * Load app configurations by environment
 */

var env = process.env.NODE_ENV || 'local';

logger.info('Environment = "' + env + '"');

module.exports = require(
	path.resolve(
		__dirname,
		'..',
		'..',
		'..',
		'wikitree-env/' + env
	)
);
