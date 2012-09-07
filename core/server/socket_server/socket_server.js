var socketIo = require('socket.io')
  , util = require('util');

var SocketServer = function(createSocketController, cport, createSocketView, vport) {
  var io = socketIo.listen(cport);
  var vio = socketIo.listen(vport);
  io.sockets.on('connection', function (socket) {
    console.log('%s: %s - connected, wait for login', socket.id.toString(), socket.handshake.address.address);
    createSocketController(socket);
  });

  vio.sockets.on('connection', function(socket) {
    console.log('%s: %s - viewer connected', socket.id.toString(), socket.handshake.address.address);
    //TODO: if have views then have pause between turns
    createSocketView(socket);
  });
};

module.exports = SocketServer;