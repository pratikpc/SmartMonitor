import express from "express";
import * as bodyParser from "body-parser";
import * as Routes from "./routes/Routes";
import * as Models from "./Models/Sequelize";
import { PassportModelsGenerate } from "./Models/Passport.Models";

class App {
  public app: express.Application;
  constructor() {
    this.app = express();
    // this.app.use(bodyParser.json());
    // middleware for parsing application/x-www-form-urlencoded
    this.app.use(bodyParser.urlencoded({ extended: true }));

    // Specify Path of Website Static Contents
    this.app.use(express.static("Website"));

    Models.RunSynchronisation().then(() => {});
    PassportModelsGenerate(this.app);

    // middleware for json body parsing
    this.app.use(bodyParser.json());
    
    // Route via this as Path to Users
    this.app.use("/user", Routes.Users);
    // Route via this as Path for Display
    this.app.use("/display", Routes.Displays);
    // Route via this as Path for File Upload
    // this.app.use("/upload", Routes.Files);
  }
}

export default new App().app;
