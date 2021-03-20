import MQTT from 'async-mqtt';
import React from 'react';

function MQTTURL() {
   return `mqtt://${window.location.hostname}:9001/`;
}

export default function MQTTRun() {
   const [client, setClient] = React.useState<MQTT.AsyncClient | null>(null);

   React.useEffect(() => {
      (async () => {
         const client = await MQTT.connectAsync(MQTTURL());
         setClient(client);
      })();
   }, []);
   return client;
}
