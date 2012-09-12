var socketIo = require('socket.io')
  , util = require('util')
  , net = require('net');

/**
 * SocketController - is a plain socket
 * SocketView - is a socket.io socket
 * @constructor
 */
var SocketServer = function(createSocketController, cport, createSocketView, vport) {

  var io = net.createServer(function(socket) {
    console.log('%s: %s - connected, wait for login', socket.remoteAddress);
    createSocketController(socket);
  });
  io.listen(cport);

  var vio = socketIo.listen(vport);
  vio.sockets.on('connection', function(socket) {
    console.log('%s: %s - viewer connected', socket.id.toString(), socket.handshake.address.address);
    createSocketView(socket);
  });
};

module.exports = SocketServer;