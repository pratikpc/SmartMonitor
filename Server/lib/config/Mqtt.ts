// import { GetIP } from "./Config.Common";

function GetMqttAddress() {
   if (process.env.MQTT_URI_CONNECTOR != null) {
      return `tcp://${process.env.MQTT_URI_CONNECTOR}:1883/`;
   }
   return 'tcp://localhost:1883/';
}

export const Url = GetMqttAddress();
export function DisplayTopic(id: number) {
   return `/display/${id}`;
}
