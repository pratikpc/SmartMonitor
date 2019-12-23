import { Router } from "express";
import { RoutesCommon, upload } from "./Common.Routes";
import * as Models from "../Models/Models";
import * as Path from "path";
import * as Config from "../config/Config";

export const Files = Router();

async function NewFileAtPathAdded(path: string, displayIDs: number[], showTime: number, startTime: number, endTime: number) {
  let extension = Path.extname(path).substr(1).toLowerCase(); // Ignores Dot

  let mediaType = Models.Files.GetFileMediaType(extension);
  if (!mediaType) throw new Error("Unknown Media Type Error");

  let name = Path.basename(path, Path.extname(path));
  const location = Path.dirname(path);

  // Convert to WebM libvpx For Java compatibility
  if (mediaType === "VIDEO") {
    await RoutesCommon.VideoConvertToWebM(path);
    await RoutesCommon.File.RemoveSingle(path);

    // We need to Add Video to name as then
    // But we can't just write into the original file
    name = name + "video";
    extension = "webm";
    path = Path.join(location, name + "." + extension);
  }
  // Get File Hash
  const fileHash = await RoutesCommon.GetSHA256FromFileAsync(path);

  // Convert Animated GIF to Video
  if (extension === "gif" && RoutesCommon.GIF.IsAnimated(path)) {
    showTime = await RoutesCommon.GIF.Duration(path, showTime);
    await RoutesCommon.GIFConvertToWebM(path);
    await RoutesCommon.File.RemoveSingle(path);

    mediaType = "VIDEO";
    name = name + "video";
    extension = "webm";
    path = Path.join(location, name + "." + extension);
  }

  const fileSame = await Models.Files.findOne({
    where: { FileHash: fileHash }
  });

  const AlreadyPresentIDs: number[] = [];
  // Same File Found
  if (fileSame) {
    extension = fileSame.Extension;
    mediaType = fileSame.MediaType;

    AlreadyPresentIDs.push(fileSame.DisplayID);
  }
  else {
    // As it's New File
    // Generate Thumbnail
    await RoutesCommon.GenerateThumbnailAsync(
      path,
      mediaType,
      Models.Files.GetThumbnailFileName(path)
    );
    await Models.Mongo.File.UploadSingle(Path.join(location, Models.Files.GetThumbnailFileName(name)), Models.Files.GetThumbnailFileName(fileHash));
  }

  const displaysWhereDownload: number[] = [];
  const displaysWhereUpdated: number[] = [];

  for (const displayId of displayIDs) {
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
            Extension: extension,
            DisplayID: displayId,
            FileHash: fileHash,
          }
        }
      );
      displaysWhereUpdated.push(displayId);
    }
    else {
      await Models.Files.create({
        Extension: extension,
        DisplayID: displayId,
        FileHash: fileHash,
        OnDisplay: true,
        TimeStart: startTime,
        TimeEnd: endTime,
        ShowTime: showTime,
        Downloaded: false
      });

      displaysWhereDownload.push(displayId);
    }
  }

  if (!fileSame)
    await Models.Mongo.File.UploadSingle(path, fileHash + "." + extension);

  return [displaysWhereUpdated, displaysWhereDownload];
}
async function NewFilesAtPathAdded(paths: string[], displayIDs: number[], showTime: number, startTime: number, endTime: number) {
  const promises: Promise<number[][]>[] = [];
  // Iterate over all the files
  for (const path of paths) {
    // Path changed if path is a video
    const promise = NewFileAtPathAdded(path, displayIDs, showTime, startTime, endTime);
    promises.push(promise);
  }
  let displayWhereDownload: number[] = [];
  let displaysWhereUpdated: number[] = [];

  // Merge all Display Details together
  // So we can send Signals
  const displays = await Promise.all(promises);
  for (const [updated, download] of displays) {
    displayWhereDownload.push(...download);
    displaysWhereUpdated.push(...updated);
  }

  // Contains all Unique Displays where Deletion and Updation Occured
  displayWhereDownload = [...new Set(displayWhereDownload)];
  displaysWhereUpdated = [...new Set(displaysWhereUpdated)];

  // Now do not send Update Signal to Displays where Create Signal being sent
  // This is because On Receiving Create Signal, the action of 
  // Update Signal is Also Performed 
  displaysWhereUpdated = displaysWhereUpdated.filter(display => !displayWhereDownload.includes(display));

  await RoutesCommon.Mqtt.SendDownloadRequests(displayWhereDownload);
  await RoutesCommon.Mqtt.SendUpdateSignals(displaysWhereUpdated);

  await RoutesCommon.File.RemoveAll(Config.Server.MediaStorage);
}

Files.post(
  "/upload",
  RoutesCommon.Validate.User,
  upload.array("files"),
  async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (files.length === 0) return res.status(422).send("Upload Failed");

      const params = RoutesCommon.GetParameters(req);
      if (params == null) return res.status(422).send("Upload Failed");

      const displayIDs = RoutesCommon.ToArray(params.ids);
      if (displayIDs.length === 0) return res.status(422).send("Upload Failed");

      const startTime = RoutesCommon.TimeToDecimal(params.startTime);
      const endTime = RoutesCommon.TimeToDecimal(params.endTime);
      if (startTime > endTime) return res.status(422).send("Upload Failed");

      // We can change showTime if it's a GIF
      const showTime = RoutesCommon.ConvertStringToIntegralGreaterThanMin(
        params.showTime,
        0 /*Default Time Set*/
      );

      const paths = files.map(value => value.path);
      await NewFilesAtPathAdded(paths, displayIDs, showTime, startTime, endTime);

      await RemoveFilesNotInDB();

      return res.status(200).redirect("/files/upload");
    } catch (err) {
      console.error(err);
      return res.status(422).send("Upload Failed");
    }
  }
);

async function RemoveFilesNotInDB() {
  const FilesInDBObj = await Models.Files.findAll();
  let FilesInDB = FilesInDBObj.map(file => file.FileName);
  FilesInDB = [...new Set(FilesInDB)].sort();
  const FilesInDBThumbnails = FilesInDB.map(file => Models.Files.GetThumbnailFileName(file));
  FilesInDB.push(...FilesInDBThumbnails);

  let FilesInMongo = await Models.Mongo.File.GetAll();
  FilesInMongo = FilesInMongo.sort();

  // Only Remove Files not referenced by Database
  // But are present in Mongo
  const FilesToRemove = FilesInMongo.filter((file) => !FilesInDB.includes(file));

  await Models.Mongo.File.RemoveMultiple(FilesToRemove);
}

Files.delete("/remove", RoutesCommon.Validate.User, async (req, res) => {
  const params = RoutesCommon.GetParameters(req);
  const fileId = Number(params.file);
  const displayId = Number(params.id);

  const FileToDelete = await Models.Files.findOne({
    where: { id: fileId, DisplayID: displayId }
  });

  if (FileToDelete == null)
    return;

  const count = await Models.Files.destroy({
    where: { id: fileId, DisplayID: displayId }
  });

  if (count === 0) return res.json({ success: false });

  await RoutesCommon.Mqtt.SendUpdateSignal(displayId);
  await RemoveFilesNotInDB();
  return res.json({ success: true });
});

Files.get("/upload/", RoutesCommon.Validate.User, RoutesCommon.NoCaching, (req, res) => {
  return res.render("ImageUpload.html");
});

// Controls if File is Hidden or Not
Files.put("/shown", RoutesCommon.Validate.User, async (req, res) => {
  try {
    const params = RoutesCommon.GetParameters(req);
    const fileId = Number(params.file);
    const displayId = Number(params.id);
    const show = String(params.show) === "true";

    const [count] = await Models.Files.update(
      { OnDisplay: show },
      {
        where: { id: fileId, DisplayID: displayId, OnDisplay: !show }
      }

    );
    if (count === 0) return res.json({ success: false });

    await RoutesCommon.Mqtt.SendUpdateSignal(displayId);

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.json({ success: false });
  }
});

Files.get("/thumbnail", RoutesCommon.Validate.User, async (req, res) => {
  try {
    const params = RoutesCommon.GetParameters(req);
    const fileId = Number(params.file);
    const displayId = Number(params.id);

    const file = await Models.Files.findOne({
      where: { id: fileId, DisplayID: displayId }
    });
    if (!file) return res.sendStatus(404);

    if (!(await Models.Mongo.File.Exists(file.ThumbnailName)))
      return res.sendStatus(404);
    await Models.Mongo.File.DownloadSingle(res, file.ThumbnailName);
  } catch (err) {
    console.error(err);
    return res.sendStatus(404);
  }
});

Files.post(
  "/download/list",
  RoutesCommon.Validate.Display,
  async (req, res) => {
    const params = RoutesCommon.GetParameters(req);
    const displayId = Number(params.id);

    const files = await Models.Files.findAll({
      attributes: ["id", "Extension", "FileHash"],
      where: { DisplayID: displayId, Downloaded: false }
    });

    const list: any[] = [];
    for (const file of files)
      list.push({ id: file.id, Name: file.FileHash, Extension: file.Extension });

    return res.json({ success: true, data: list });
  }
);

async function StreamMedia(res: any, displayId: number, fileId: number) {
  const file = await Models.Files.findOne({
    where: { DisplayID: displayId, id: fileId }
  });

  if (file == null)
    return res.sendStatus(404);

  const fileName = file.FileName as string;

  if (file.MediaType! === "VIDEO")
    await Models.Mongo.File.DownloadVideoFromStream(res, fileName);
  else if (file.MediaType! === "IMAGE") {
    // await  Models.Mongo.File.AddParamsToStreamResponse(res, fileName);
    const image = await Models.Mongo.File.Stream.Download(fileName);
    await RoutesCommon.ConvertImageToVideo(res, image, file.ShowTime);
  }
}
Files.get("/stream/:displayId/:fileId", async (req, res) => {
  const params = RoutesCommon.GetParameters(req);
  const displayId = Number(params.displayId);
  const fileId = Number(params.fileId);
  await StreamMedia(res, displayId, fileId);
  console.log(res.getHeaders());
});

Files.post(
  "/download/file",
  RoutesCommon.Validate.Display,
  async (req, res) => {
    const params = RoutesCommon.GetParameters(req);
    const fileId = Number(params.file);
    const displayId = Number(params.id);

    const file = await Models.Files.findOne({
      where: { id: fileId, DisplayID: displayId, Downloaded: false }
    });

    if (!file) return res.sendStatus(404);
    if (!(await Models.Mongo.File.Exists(file.FileName)))
      return res.sendStatus(404);
    await Models.Mongo.File.DownloadSingle(res, file.FileName);
  }
);

Files.post(
  "/list/filesFX",
  RoutesCommon.Validate.Display,
  async (req, res) => {
    try {
      const params = RoutesCommon.GetParameters(req);

      if (params == null)
        return res.json({
          success: false,
          data: []
        });
      const id = Number(params.id);

      const data: any[] = [];
      const files = await Models.Files.findAll({
        where: { DisplayID: id },
        order: [["id", "ASC"]]
      });

      for (const file of files) {
        data.push({
          file: file.id,
          Path: file.FileName,
          Start: file.TimeStart,
          End: file.TimeEnd,
          ShowTime: file.ShowTime,
          OnDisplay: file.OnDisplay
        });
      }
      return res.json({ success: true, data: data });
    } catch (err) {
      console.error(err);
    }
    return res.json({
      success: false,
      data: []
    });
  }
);

