import { Router, Request, Response, NextFunction } from "express";
import { RoutesCommon } from "./Common.Routes";
import * as Models from "../Models/Models";
import { randomBytes } from "crypto";
import { extname } from "path";
import * as fs from "fs";
import * as multer from "multer";
import * as Path from "path";
import { Mqtt } from "../config/Mqtt";

const storage = multer.diskStorage({
  destination: (request: any, file: any, callback: any) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    callback(null, dir);
  },
  filename: (request: any, file: any, callback: any) => {
    let fileName = "";
    while (true) {
      const name = randomBytes(12).toString("hex");
      const ext = extname(file.originalname);
      fileName = name + ext;
      if (!fs.existsSync(fileName)) break;
    }

    callback(null, fileName);
  }
});
const upload = multer.default({ storage: storage });

export const Files = Router();

Files.post(
  "/upload",
  RoutesCommon.IsAuthenticated,
  upload.array("files"),
  async (req, res) => {
    console.log("Name");
   const files = req.files as any[];
 
    if (files.length === 0)
      return res.render("ImageUpload.html");

    const params = RoutesCommon.GetParameters(req);

    const checkBoxSelectedID = params.ids;

    if (Array.isArray(checkBoxSelectedID)) {
      const checkBoxSelectedIDs = checkBoxSelectedID as number[];
      if (checkBoxSelectedIDs.length === 0)
        return res.render("ImageUpload.html");

      files.forEach(file => {
        const ext = Path.extname(file.filename).substr(1);
        const name = Path.basename(file.filename, Path.extname(file.filename));

        checkBoxSelectedIDs.forEach(async displayId => {
          const fileAdd = await Models.Files.create({
            Name: name,
            Extension: ext,
            Location: file.destination,
            DisplayID: displayId
          });
        });
      });
      checkBoxSelectedIDs.forEach(async displayId => {
        if (!RoutesCommon.MqttClient.connected)
          return;
        RoutesCommon.MqttClient.publish(Mqtt.DisplayTopic(displayId), "Check");
      });
    }
    else {
      files.forEach(async file => {
        const ext = Path.extname(file.filename).substr(1);
        const name = Path.basename(file.filename, Path.extname(file.filename));

        const fileAdd = await Models.Files.create({
          Name: name,
          Extension: ext,
          Location: file.destination,
          DisplayID: Number(checkBoxSelectedID)
        });
      });
      if (!RoutesCommon.MqttClient.connected)
        return res.render("ImageUpload.html");
      RoutesCommon.MqttClient.publish(Mqtt.DisplayTopic(checkBoxSelectedID), "Check");

    }
    console.log("Name", params, params.ids, checkBoxSelectedID);

    return res.render("ImageUpload.html");
  }
);

Files.get("/upload/", RoutesCommon.IsAuthenticated, async (req, res) => {
  return res.render("ImageUpload.html");
});

Files.get("/download/list", ValidateActualDisplay, async (req, res) => {
  const params = RoutesCommon.GetParameters(req);
  const displayId = Number(params.id);

  const files = await Models.Files.findAll({
    attributes: ["id", "Extension", "Name"],
    where: { DisplayID: displayId }
  });

  const list: any[] = [];
  files.forEach(file => {
    list.push({ id: file.id, Name: file.Name, Extension: file.Extension });
  });
  return res.json({ success: true, data: list });
});

Files.delete("/download/file", ValidateActualDisplay, async (req, res) => {
  const params = RoutesCommon.GetParameters(req);
  const fileId = Number(params.file);
  const displayId = Number(params.id);

  const count = await Models.Files.destroy({
    where: { id: fileId, DisplayID: displayId }
  });

  if (count === 0) return res.json({ success: false });
  else return res.json({ success: true });
});

Files.get("/download/file", ValidateActualDisplay, async (req, res) => {
  const params = RoutesCommon.GetParameters(req);
  const fileId = Number(params.file);
  const displayId = Number(params.id);

  const file = await Models.Files.findOne({
    attributes: ["PathToFile"],
    where: { id: fileId, DisplayID: displayId }
  });

  if (!file) return res.json({ success: false });

  const path = file.PathToFile;

  return res.download(path);
});

function ValidateActualDisplay(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const params = RoutesCommon.GetParameters(req);

  if (!params) {
    res.json({ success: false });
    return;
  }

  const id = Number(params.id);
  const key = String(params.key);

  if (!id || !key) {
    res.json({ success: false });
    return;
  }
  Models.Displays.count({
    where: { id: id, IdentifierKey: key }
  }).then(async count => {
    if (count !== 0) next();
    else res.json({ succes: false });
  });
}
