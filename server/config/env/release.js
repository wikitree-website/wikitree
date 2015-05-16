'use strict';

var fs = require('fs');

var secrets = require('./secrets/release');

module.exports = {
	domain: 'wikitree.website',
	ports: {
		http: process.env.HTTP_PORT || 80,
		https: process.env.HTTPS_PORT || 443
	},
	https: {
		private_key: fs.readFileSync(__dirname + '/secrets/ssl/wikitree.website-key.pem', 'utf-8'),
		public_cert: fs.readFileSync(__dirname + '/secrets/ssl/wikitree.website-cert.pem', 'utf-8')
	},
	db: {
		database: 'wikitree',
		username: secrets.db.username,
		password: secrets.db.password,
		host: '127.0.0.1',
		port: 3306,
		pool: {
			connectionLimit: 100
		}
	}
};
