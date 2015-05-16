'use strict';

var fs = require('fs');

var secrets = require('./secrets/local');

module.exports = {
	domain: 'localhost',
	ports: {
		http: process.env.HTTP_PORT || 1111,
		https: process.env.HTTPS_PORT || 2222
	},
	https: {
		private_key: fs.readFileSync(__dirname + '/secrets/ssl/localhost-key.pem', 'utf-8'),
		public_cert: fs.readFileSync(__dirname + '/secrets/ssl/localhost-cert.pem', 'utf-8')
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
