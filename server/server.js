'use strict';

var logger = require('./lib/log');

logger.info('-------------------------------------');
logger.info(' Starting up servers...');
logger.info('-------------------------------------');

var env = require('./config/env');

var http = require('http');

var chalk = require('chalk');
var Promise = require('bluebird');

var passport = require('./config/passport');
var express = require('./config/express');


// configure passport & express
passport();
var app = express();

// create HTTP server and pass express app as handler
var httpServer = http.createServer(app);

// start listening for HTTP
httpServer.listen(env.http.port, function () {
	logger.info(
		chalk.bold.blue(
			'HTTP app server listening on port ' +
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
				logger.warn(chalk.bold.red('HTTP app server shut down'));
			});
			// destroy remaining sockets
			Object.keys(sockets).forEach(function (key) {
				sockets[key].destroy();
			});
		};
	};

	// listen for server connections
	httpServer.on('connection', handleConnection);

	// listen for shutdown signals
	process.on('SIGTERM', makeHandleShutdown('SIGTERM'));
	process.on('SIGINT', makeHandleShutdown('SIGINT'));

})();