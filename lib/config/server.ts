import { networkInterfaces } from "os";

function GetIP() {
  var interfaces = networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];

    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
        return alias.address;
    }
  }

  return '127.0.0.1';
}

export const Server = {
  Port: 8000,
  Name: GetIP()
};


