import * as dotenv from "dotenv"

// If No import taking place from .env file
// Use this to ensure that dotenv file is loaded
if (!process.env.Dialect) {
  dotenv.config();
}

import express from "express";
import * as bodyParser from "body-parser";
import * as Models from "./Models/Sequelize";
import * as Routes from "./routes/Routes";
import * as cors from "cors";
import { PassportModelsGenerate } from "./Models/Passport.Models";
import { RoutesCommon } from "./routes/Common.Routes";

export async function App() {

  const app = express();

  // app.use(bodyParser.json());
  // middleware for parsing application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: true }));

  // Use this to Render HTML

  // Specify Path of Website Static Contents
  app.engine('.html', require('ejs').renderFile);
  app.set("views", "./Views");
  app.set('view engine', 'ejs');

  // Only Enable if our app is not dockerised
  // In Dockerised App, static files are served by
  // NGINX
  // Thus reducing the load on server
  if (!process.env.APP_IS_DOCKERISED) {
    app.use("/static/", express.static("./Website"));
  }

  await Models.RunSynchronisation();
  PassportModelsGenerate(app);

  app.use(cors.default());
  // middleware for json body parsing
  app.use(bodyParser.json());
  // middleware for parsing application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: true }));
  // middleware for json body parsing
  app.use(bodyParser.json({ limit: "20mb" }));

  // Route via this as Path to Users
  app.use("/user", Routes.Users);
  // Route via this as Path for Display
  app.use("/display", Routes.Displays);
  // Route via this as path for File Uploading and Downloading
  app.use("/files", Routes.Files);

  app.get("/navbar", RoutesCommon.IsAuthenticated, (req, res) => {
    if (RoutesCommon.GetUser(req).Authority === "ADMIN")
      return res.render("navbaradmin.html");
    else
      return res.render("navbarnormal.html");
  });

  app.get("/", (req, res) => {
    if (req.isUnauthenticated()) return res.render("login.html");
    return res.redirect("/files/upload");
  });

  return app;
}