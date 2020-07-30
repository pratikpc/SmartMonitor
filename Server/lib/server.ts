import * as Server from "./config/server";
import App from "./app";

App().then((app) => {
  app.listen(Server.Port, Server.Name, () => {
    console.info("Default Login Screen", Server.Name + ":" + Server.Port);
  });

  process.on("SIGINT", function () {
    console.info("App Shutting Down");
  });
});
