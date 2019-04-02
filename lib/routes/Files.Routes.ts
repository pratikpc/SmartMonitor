import { Router } from "express";
import { RoutesCommon, upload } from "./Common.Routes";
import * as Models from "../Models/Models";
import * as fs from "fs";
import * as Path from "path";

export const Files = Router();

Files.post(
  "/upload",
  RoutesCommon.IsAuthenticated,
  upload.array("files"),
  async (req, res) => {
    try {
      const files = req.files as any[];
      if (files.length === 0) return res.redirect("/files/upload");

      const params = RoutesCommon.GetParameters(req);
      if (params == null) return res.redirect("/files/upload");

      const displayIDs = RoutesCommon.GetDataAsArray<number>(params.ids);
      const startTime = 0;
      const endTime = 0;
      const showTime = 0;

      if (displayIDs.length === 0) return res.redirect("/files/upload");

      // Iterate over all the files
      files.forEach(async file => {
        let extension = Path.extname(file.filename).substr(1);
        let mediaType = RoutesCommon.GetFileMediaType(extension);

        if (!mediaType) return;

        let name = Path.basename(file.filename, Path.extname(file.filename));
        let location = file.destination;

        // Get File Hash
        let fileHash = String(
          await RoutesCommon.GetSHA256FromFile(location + "/" + file.filename)
        );
        // Get File Size
        let fileSize = Number(file.size);

        const fileSame = await Models.Files.findOne({
          where: { FileSize: fileSize, FileHash: fileHash }
        });

        const AlreadyPresentIDs: number[] = [];
        // Same File Found
        if (fileSame) {
          fs.unlink(file.path, () => {});

          name = fileSame.Name;
          extension = fileSame.Extension;
          location = fileSame.Location;
          fileHash = fileSame.FileHash;
          fileSize = fileSame.FileSize;
          mediaType = fileSame.MediaType;

          AlreadyPresentIDs.push(fileSame.id);
        }
        // As it's not something that already exists
        // We can check if it's video and Generate Thumbnail accordingly
        if (!fileSame)
          RoutesCommon.GenerateThumbnail(
            location,
            name,
            extension,
            mediaType,
            Models.Files.GetThumbnailFileName(name, extension, mediaType)
          );

        displayIDs.forEach(async displayId => {
          if (AlreadyPresentIDs.includes(displayId)) {
            // As File getting Reuploaded, rather than doing nothing, we assume
            // It's user's instruction to show the file
            await Models.Files.update(
              {
                OnDisplay: true,
                TimeStart: startTime,
                TimeEnd: endTime,
                ShowTime: showTime
              },
              {
                where: {
                  Name: name,
                  Extension: extension,
                  Location: location,
                  DisplayID: displayId,
                  FileHash: fileHash,
                  FileSize: fileSize,
                  MediaType: mediaType!
                }
              }
            );
          } else {
            await Models.Files.create({
              Name: name,
              Extension: extension,
              Location: location,
              DisplayID: displayId,
              FileHash: fileHash,
              FileSize: fileSize,
              MediaType: mediaType!,
              OnDisplay: true,
              TimeStart: startTime,
              TimeEnd: endTime,
              ShowTime: showTime,
              Downloaded: false
            });
          }
        });
      });

      if (RoutesCommon.MqttClient.connected) {
        displayIDs.forEach(displayId => {
          RoutesCommon.SendMqttClientDownloadRequest(displayId);
        });
      }

      return res.redirect("/files/upload");
    } catch (error) {
      console.error(error);
      return res.redirect("/files/upload");
    }
  }
);

Files.delete("/remove", RoutesCommon.IsAuthenticated, async (req, res) => {
  const params = RoutesCommon.GetParameters(req);
  const fileId = Number(params.file);
  const displayId = Number(params.id);

  const count = await Models.Files.destroy({
    where: { id: fileId, DisplayID: displayId }
  });

  if (count === 0) return res.json({ success: false });
  else return res.json({ success: true });
});

Files.get("/upload/", RoutesCommon.IsAuthenticated, async (req, res) => {
  return res.render("ImageUpload.html");
});

Files.post(
  "/download/list",
  RoutesCommon.ValidateActualDisplay,
  async (req, res) => {
    const params = RoutesCommon.GetParameters(req);
    const displayId = Number(params.id);

    const files = await Models.Files.findAll({
      attributes: ["id", "Extension", "Name"],
      where: { DisplayID: displayId, Downloaded: false }
    });

    const list: any[] = [];
    files.forEach(file => {
      list.push({ id: file.id, Name: file.Name, Extension: file.Extension });
    });
    return res.json({ success: true, data: list });
  }
);

// Controls if File is Hidden or Not
Files.put("/shown", RoutesCommon.IsAuthenticated, async (req, res) => {
  try {
    const params = RoutesCommon.GetParameters(req);
    const fileId = Number(params.file);
    const displayId = Number(params.id);
    const show = Boolean(params.show);

    const [count] = await Models.Files.update(
      { OnDisplay: show },
      {
        where: { id: fileId, DisplayID: displayId, OnDisplay: !show }
      }
    );
    if (count === 0) return res.json({ success: false });

    if (RoutesCommon.MqttClient.connected) {
      RoutesCommon.SendMqttClientUpdateSignal(displayId);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.json({ success: false });
  }
});

Files.get("/thumbnail", RoutesCommon.IsAuthenticated, async (req, res) => {
  try {
    const params = RoutesCommon.GetParameters(req);
    const fileId = Number(params.file);
    const displayId = Number(params.id);

    const file = await Models.Files.findOne({
      where: { id: fileId, DisplayID: displayId }
    });
    if (!file) return res.json({ success: false });

    const path = file.GetThumbnailFileLocation();
    return res.download(path);
  } catch (err) {
    console.error(err);
    return res.json({ success: false });
  }
});

Files.delete(
  "/download/file",
  RoutesCommon.ValidateActualDisplay,
  async (req, res) => {
    const params = RoutesCommon.GetParameters(req);
    const fileId = Number(params.file);
    const displayId = Number(params.id);

    const [count] = await Models.Files.update(
      { Downloaded: true },
      {
        where: { id: fileId, DisplayID: displayId, Downloaded: false }
      }
    );

    if (count === 0) return res.json({ success: false });
    else return res.json({ success: true });
  }
);

Files.post(
  "/download/file",
  RoutesCommon.ValidateActualDisplay,
  async (req, res) => {
    const params = RoutesCommon.GetParameters(req);
    const fileId = Number(params.file);
    const displayId = Number(params.id);

    const file = await Models.Files.findOne({
      attributes: ["PathToFile"],
      where: { id: fileId, DisplayID: displayId, Downloaded: false }
    });

    if (!file) return res.json({ success: false });

    const path = file.PathToFile;

    return res.download(path);
  }
);

Files.post(
  "/list/filesFX",
  RoutesCommon.ValidateActualDisplay,
  async (req, res) => {
    try {
      const params = RoutesCommon.GetParameters(req);

      if (params == null)
        return res.json({
          success: false,
          data: null
        });
      const id = Number(params.id);

      const data: any[] = [];
      const files = await Models.Files.findAll({ where: { DisplayID: id } });

      files.forEach(file => {
        data.push({
          file: file.id,
          Path: file.Name + "." + file.Extension,
          Start: file.TimeStart,
          End: file.TimeEnd,
          ShowTime: file.ShowTime,
          OnDisplay: file.OnDisplay
        });
      });

      return res.json({ success: true, data: data });
    } catch (err) {
      console.error(err);
    }
    return res.json({
      success: false,
      data: null
    });
  }
);
