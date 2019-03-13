export const Mqtt = {
  Url: "mqtt://localhost:1883/",
  DisplayTopic: (id: number) => {
    return "/display/" + id;
  }
};
