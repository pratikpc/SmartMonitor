import { networkInterfaces } from "os";

function GetMqttAddress() {
  const interfaces = networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];

    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (
        alias.family === "IPv4" &&
        alias.address !== "127.0.0.1" &&
        !alias.internal
      )
        return "tcp://" + alias.address + ":1883/";
    }
  }

  return "tcp://127.0.0.1:1883";
}

export const Mqtt = {
  Url: GetMqttAddress(),
  DisplayTopic: (id: number) => {
    return "/display/" + id;
  }
};
