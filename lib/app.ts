import express from "express";
import * as bodyParser from "body-parser";
import * as Routes from "./routes/Routes";
import * as Models from "./Models/Sequelize";
import { PassportModelsGenerate } from "./Models/Passport.Models";

import * as ejs from 'ejs';

export const app = express();
// app.use(bodyParser.json());
// middleware for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Use this to Render HTML

// Specify Path of Website Static Contents
app.engine('html', ejs.renderFile);
app.set('views', './Views');
app.use(express.static("./Website"));

Models.RunSynchronisation().then(() => {});
PassportModelsGenerate(app);

// middleware for json body parsing
app.use(bodyParser.json());

// Route via this as Path to Users
app.use("/user", Routes.Users);
// Route via this as Path for Display
app.use("/display", Routes.Displays);
// Route via this as path for File Uploading and Downloading
app.use("/files", Routes.Files);
