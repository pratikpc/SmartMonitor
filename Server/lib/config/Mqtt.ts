import { GetIP } from "./Config.Common";

function GetMqttAddress() {
  if (process.env.MQTT_URI_CONNECTOR) {
    return "tcp://" + process.env.MQTT_URI_CONNECTOR + ":1883/";
  }
  return "tcp://" + GetIP() + ":1883/";
}

export const Mqtt = {
  Url: GetMqttAddress(),
  DisplayTopic: (id: number) => {
    return "/display/" + id;
  }
};
