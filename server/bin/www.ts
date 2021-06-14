#!/usr/bin/env node

/**
 * Module dependencies.
 */


import debugLib from 'debug';
import http from 'http';
import "regenerator-runtime/runtime";
import slowDown from "express-slow-down";

const debug = debugLib('debug')('node:server');

import app from '../app';

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '8080');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Slow Down Rate Limiter Setup
 */
//  app.enable("trust proxy");
 const speedLimiter = slowDown({
  windowMs: 60000, // 1 minutes
  delayAfter: 25, // allow 25 requests per minute, then...
  delayMs: 200 // begin adding 200ms of delay per request above 25:
});

//  apply to all requests
app.use(speedLimiter);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


console.log('Server Started on port ' + port);
/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  // debug('Listening on ' + bind);
}
