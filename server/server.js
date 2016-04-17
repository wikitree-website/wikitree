'use strict';

var logger = require('./lib/log');

logger.info('-------------------------------------');
logger.info(' Starting up servers...');
logger.info('-------------------------------------');

var env = require('./config/env');

var http = require('http');
var https = require('https');

var chalk = require('chalk');
var Promise = require('bluebird');

var passport = require('./config/passport');
var express = require('./config/express');


// expose promise for testing
module.exports = new Promise(function (resolve, reject) {
	//db.testConnection()
	//	.then(function () {

			/**
			 * Success
			 */

			//console.log(chalk.bold.green('Database connection successful'));

			// configure passport & express
			passport();
			var app = express();

			// create HTTPS server and pass express app as handler
			var httpsServer = https.createServer({
				key: env.https.private_key,
				cert: env.https.public_cert
			}, app);

			// create HTTP server for forwarding to HTTPS
			var httpServer = http.createServer(function (req, res) {
				logger.info(chalk.bold.yellow('Redirecting HTTP request: ' + req.url));
				var redirectUrl = 'https://' + env.domain;
				if (env.https.port !== 443) {
					redirectUrl += ':' + env.https.port;
				}
				redirectUrl += req.url;
				res.writeHead(301, {
					'Location': redirectUrl
				});
				return res.end();
			});

			// start listening for HTTPS
			httpsServer.listen(env.https.port, function () {
				logger.info(
					chalk.bold.blue(
						'HTTPS app server listening on port ' +
						httpsServer.address().port
					)
				);
			});

			// start listening for HTTP
			httpServer.listen(env.http.port, function () {
				logger.info(
					chalk.bold.blue(
						'HTTP redirect server listening on port ' +
						httpServer.address().port
					)
				);
			});


			// graceful shutdown
			// when the process is killed, this will close the server, refusing all new requests
			// but continuing to process existing ones, calling the callback when finished
			//
			// new!
			// force killing current connections also
			// because server was taking forever to exit
			// (so, is this even needed anymore? TBD)
			// http://stackoverflow.com/questions/14626636
			(function () {

				var isShutDown = false;
				var sockets = {};

				function handleConnection(socket) {
					// add newly connected socket
					var key = socket.remoteAddress + ':' + socket.remotePort;
					sockets[key] = socket;
					// remove socket when it closes
					socket.once('close', function () {
						delete sockets[key];
					});
				}

				function makeHandleShutdown(signal) {
					return function handleShutdown() {
						if (isShutDown) return;
						else isShutDown = true;
						console.log();
						logger.warn(chalk.bold.yellow(signal + ' signal, shutting down servers...'));
						// close http server
						httpServer.close(function() {
							logger.warn(chalk.bold.red('HTTP redirect server shut down'));
						});
						// close https server
						httpsServer.close(function() {
							logger.warn(chalk.bold.red('HTTPS app server shut down'));
							// shutdown database
							/*db.shutdown()
								.then(function () {
									logger.warn(chalk.bold.red('Database shut down'));
								})
								.catch(function (err) {
									logger.log(chalk.bold.magenta('Database failed to shut down'));
									logger.log(err);
								});*/
						});
						// destroy remaining sockets
						Object.keys(sockets).forEach(function (key) {
							sockets[key].destroy();
						});
					};
				};

				// listen for server connections
				httpServer.on('connection', handleConnection);
				httpsServer.on('connection', handleConnection);

				// listen for shutdown signals
				process.on('SIGTERM', makeHandleShutdown('SIGTERM'));
				process.on('SIGINT', makeHandleShutdown('SIGINT'));

			})();


			// resolve promise with express app
			resolve(app);

		/*});
		.catch(function (err) {


			console.error(chalk.bold.yellow('Unable to connect to database:', err));
			console.error(chalk.bold.red('Server startup failed'));

			// reject promise with error
			reject(err);

		});*/
});
