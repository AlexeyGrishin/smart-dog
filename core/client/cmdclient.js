/**
 * Options may be specified in config.json or in command line as '-name value -name2 value2'
 * Options:
 *   name - user name
 *   host - server host, localhost by default
 *   port - server port, 3002 by default
 *   exe  - if specified then this process will be started and all output/input will be performed with it.
 *          Otherwise with stdin/stdout
 *
 */
var config = require('./config.json')
  , net = require('net')
  , readline = require('readline');

var args = process.argv.slice(2);
var argMap = config;
for (var i = 0; i < args.length; i+=2) {
  argMap[args[i].substring(1)] = args[i+1];
}
if (!argMap.host) argMap.host = "localhost";
if (!argMap.port) argMap.port = 3002;
if (argMap.exe) {
  try {
    var client = require('child_process').exec(argMap.exe, function(error, stdout, stderr) {
      if (error) {
        console.error("Cannot run '" + argMap.exe + "' - " + error);
        return;
      }
    });
    doConnectAndProcess(readline.createInterface({
      input: client.stdout,
      output: client.stdin
    }))
  }
  catch (e) {
    console.error("Cannot run '" + argMap.exe + "'");
    console.trace(e);
  }
}
else {
  process.stdin.setEncoding('utf8');
  doConnectAndProcess(readline.createInterface({
    input: process.stdin,
    output: process.stdout
  }));

}

function doConnectAndProcess(realClient) {

  var socket = new net.Socket();
  var remoteServer = readline.createInterface({
    input: socket,
    output: socket
  });
  remoteServer.on('line', function(data) {
    realClient.output.write(data);
  });
  realClient.on('line', function(data) {
    socket.write(data);
  });
  socket.on('error', function(err) {
    console.error('Connection Failed - ' + err);
    remoteServer.close();
  });
  socket.on('close', function() {
    console.error('Connection Closed');
    remoteServer.close();
    process.exit();
  });
  socket.connect(argMap.port, argMap.host, function() {
    console.error('Connected');
  });
}