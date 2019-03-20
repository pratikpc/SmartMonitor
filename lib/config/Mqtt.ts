import { networkInterfaces } from "os";

function GetMqttAddress() {
  var interfaces = networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];

    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
        return ("tcp://" + alias.address + ":1883/");
    }
  }

  return 'tcp://127.0.0.1:1883';
}

export const Mqtt = {
  Url: GetMqttAddress(),
  DisplayTopic: (id: number) => {
    return "/display/" + id;
  }
};
