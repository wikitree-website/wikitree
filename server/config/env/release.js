'use strict';

module.exports = {
	domain: 'wikitree.website',
	ports: {
		http: process.env.HTTP_PORT || 80,
		https: process.env.HTTPS_PORT || 443
	}
};
