import express from "express";
import * as bodyParser from "body-parser";
import * as Routes from "./routes/Routes";
import * as Models from "./Models/Sequelize";

class App {
  public app: express.Application;
  constructor() {
    this.app = express();
    // this.app.use(bodyParser.json());
    // middleware for parsing application/x-www-form-urlencoded
    this.app.use(bodyParser.urlencoded({ extended: true }));

    // Specify Path of Website Static Contents
    this.app.use(express.static("Website"));

    // middleware for json body parsing
    this.app.use(bodyParser.json());
    // Route via this as Path to Users
    this.app.use("/user", Routes.Users);
    Models.RunSynchronisation().then(() => {});
  }
}

export default new App().app;
