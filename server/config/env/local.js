'use strict';

module.exports = {
	domain: 'localhost',
	ports: {
		http: process.env.HTTP_PORT || 1111,
		https: process.env.HTTPS_PORT || 2222
	},
};
