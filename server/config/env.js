'use strict';

/**
 * Load app configurations by environment
 */

var logger = require('../lib/log');

var env = process.env.NODE_ENV || 'local';

logger.info('Environment = "' + env + '"');

module.exports = require(__dirname + '../../../../wikitree-env/' + env);
