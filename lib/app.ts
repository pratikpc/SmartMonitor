import express from "express";
import * as bodyParser from "body-parser";
import * as Routes from "./routes/Routes";
import * as Models from "./Models/Sequelize";
import * as cors from "cors";
import { PassportModelsGenerate } from "./Models/Passport.Models";
import * as ejs from "ejs";
import { RoutesCommon } from "./routes/Common.Routes";

export const app = express();
// app.use(bodyParser.json());
// middleware for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Use this to Render HTML

// Specify Path of Website Static Contents
app.engine("html", ejs.renderFile);
app.set("views", "./Views");
app.use(express.static("./Website"));

Models.RunSynchronisation().then(() => {});
PassportModelsGenerate(app);

app.use(cors.default());
// middleware for json body parsing
app.use(bodyParser.json());
// middleware for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));
// middleware for json body parsing
app.use(bodyParser.json({limit: '5mb'}));

// Route via this as Path to Users
app.use("/user", Routes.Users);
// Route via this as Path for Display
app.use("/display", Routes.Displays);
// Route via this as path for File Uploading and Downloading
app.use("/files", Routes.Files);

app.get("/list", RoutesCommon.IsAuthenticated, (req,res)=>
{
  return res.render("displist.html");
});


app.get("/", (req, res)=>{return res.redirect("/user/login");});
