import { Router } from 'express';
import type { Request } from 'express';
import Path from 'path';
import multer from 'multer';
import { randomBytes } from 'crypto';
import fs from 'fs';

import { RoutesCommon } from './Common.Routes';
import * as Models from '../Models';
import * as Config from '../config';

export const Files = Router();
export default Files;
const storage = multer.diskStorage({
   destination: async (
      _request: Request,
      _file: Express.Multer.File,
      callback: (error: Error | null, destination: string) => void
   ) => {
      const dir = Config.Server.MediaStorage;
      await RoutesCommon.File.DirectoryCreate(dir);
      callback(null, dir);
   },
   filename: (
      _request: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void
   ) => {
      let fileName = '';
      do {
         const name = randomBytes(12).toString('hex');
         const ext = Path.extname(file.originalname).toLowerCase();
         fileName = name + ext;
      } while (fs.existsSync(fileName));

      callback(null, fileName);
   }
});
const upload = multer({
   storage: storage,
   // Set File Size Limit of 25 MB
   limits: { fileSize: 1024 * 1024 * 25 }
});

async function NewFileAtPathAdded(
   pathP: string,
   displayIDs: number[],
   showTimeP: number,
   startTime: number,
   endTime: number
) {
   let path = pathP;
   let showTime = showTimeP;
   let extension = Path.extname(path).substr(1).toLowerCase(); // Ignores Dot

   let mediaType = RoutesCommon.GetFileMediaType(extension);
   if (!mediaType) throw new Error('Unknown Media Type Error');

   let name = Path.basename(path, Path.extname(path));
   const location = Path.dirname(path);

   // Convert to Mp4 x264 For Java compatibility
   if (mediaType === 'VIDEO') {
      await RoutesCommon.VideoChangeFormatToH264(path);
      await RoutesCommon.File.RemoveSingle(path);

      // We need to Add Video to name as then
      // We need to also convert MP4 Files to New Format
      // But we can't just write into the original file
      name += 'video';
      extension = 'mp4';
      path = Path.join(location, `${name}.${extension}`);
   }
   // Get File Hash
   const fileHash = await RoutesCommon.GetSHA256FromFileAsync(path);

   const fileSame = await Models.Files.findOne({
      where: { FileHash: fileHash }
   });

   const AlreadyPresentIDs: number[] = [];
   // Same File Found
   if (fileSame) {
      extension = fileSame.Extension;
      mediaType = fileSame.MediaType;

      AlreadyPresentIDs.push(fileSame.DisplayID);
   } else {
      // As it's New File
      // Generate Thumbnail
      await RoutesCommon.GenerateThumbnailAsync(path, mediaType, Models.Files.GetThumbnailFileName(path));
      await Models.Mongo.File.UploadSingle(
         Path.join(location, Models.Files.GetThumbnailFileName(name)),
         Models.Files.GetThumbnailFileName(fileHash)
      );

      if (extension === 'gif') {
         showTime = await RoutesCommon.GIFDuration(path, showTime);
      }
   }

   const displaysWhereDownload: number[] = [];
   const displaysWhereUpdated: number[] = [];
   const displayAddMedias: Promise<unknown>[] = [];
   for (const displayId of displayIDs) {
      if (AlreadyPresentIDs.includes(displayId)) {
         // As File getting Reuploaded, rather than doing nothing, we assume
         // It's user's instruction to show the file
         displayAddMedias.push(
            Models.Files.update(
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
                     MediaType: mediaType
                  }
               }
            )
         );
         displaysWhereUpdated.push(displayId);
      } else {
         displayAddMedias.push(
            Models.Files.create({
               Extension: extension,
               DisplayID: displayId,
               FileHash: fileHash,
               MediaType: mediaType,
               OnDisplay: true,
               TimeStart: startTime,
               TimeEnd: endTime,
               ShowTime: showTime,
               Downloaded: false
            })
         );
         displaysWhereDownload.push(displayId);
      }
   }

   await Promise.all(displayAddMedias);

   if (!fileSame) await Models.Mongo.File.UploadSingle(path, `${fileHash}.${extension}`);

   return { displaysWhereUpdated: displaysWhereUpdated, displaysWhereDownload: displaysWhereDownload };
}
async function NewFilesAtPathAdded(
   paths: string[],
   displayIDs: number[],
   showTime: number,
   startTime: number,
   endTime: number
) {
   const promises: Promise<{
      displaysWhereUpdated: number[];
      displaysWhereDownload: number[];
   }>[] = [];
   // Iterate over all the files
   for (const path of paths) {
      // Path changed if path is a video
      const promise = NewFileAtPathAdded(path, displayIDs, showTime, startTime, endTime);
      promises.push(promise);
   }
   let displayWhereDownload: number[] = [];
   let displayWhereUpdated: number[] = [];

   // Merge all Display Details together
   // So we can send Signals
   const displays = await Promise.all(promises);
   for (const { displaysWhereUpdated, displaysWhereDownload } of displays) {
      displayWhereDownload.push(...displaysWhereDownload);
      displayWhereUpdated.push(...displaysWhereUpdated);
   }

   // Contains all Unique Displays where Deletion and Updation Occured
   displayWhereDownload = [...new Set(displayWhereDownload)];
   displayWhereUpdated = [...new Set(displayWhereUpdated)];

   // Now do not send Update Signal to Displays where Create Signal being sent
   // This is because On Receiving Create Signal, the action of
   // Update Signal is Also Performed
   displayWhereUpdated = displayWhereUpdated.filter(display => !displayWhereDownload.includes(display));

   await RoutesCommon.Mqtt.SendDownloadRequests(displayWhereDownload);
   await RoutesCommon.Mqtt.SendUpdateSignals(displayWhereUpdated);

   await RoutesCommon.File.RemoveAll(Config.Server.MediaStorage);
}
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
   const FilesToRemove = FilesInMongo.filter(file => !FilesInDB.includes(file));

   await Models.Mongo.File.RemoveMultiple(FilesToRemove);
}

Files.post('/upload', RoutesCommon.IsAuthenticated, upload.array('files'), async (req, res) => {
   try {
      const files = req.files as Express.Multer.File[];
      if (files.length === 0) return res.status(422).send('Upload Failed');

      const params = RoutesCommon.GetParameters(req);
      if (params == null) return res.status(422).send('Upload Failed');

      const displayIDs = RoutesCommon.ToArray(params.ids);
      if (displayIDs.length === 0) return res.status(422).send('Upload Failed');

      const startTime = RoutesCommon.TimeToDecimal(params.startTime);
      const endTime = RoutesCommon.TimeToDecimal(params.endTime);
      if (startTime > endTime) return res.status(422).send('Upload Failed');

      // We can change showTime if it's a GIF
      const showTime = RoutesCommon.ConvertStringToIntegralGreaterThanMin(params.showTime, 0 /* Default Time Set */);

      const paths = files.map(value => value.path);
      await NewFilesAtPathAdded(paths, displayIDs, showTime, startTime, endTime);

      await RemoveFilesNotInDB();

      return res.status(200).redirect('/files/upload');
   } catch (err) {
      console.error(err);
      return res.status(422).send('Upload Failed');
   }
});

Files.delete('/remove', RoutesCommon.IsAuthenticated, async (req, res) => {
   const params = RoutesCommon.GetParameters(req);
   const fileId = Number(params.file);
   const displayId = Number(params.id);

   const FileToDelete = await Models.Files.findOne({
      where: { id: fileId, DisplayID: displayId }
   });

   if (FileToDelete == null) return res.json({ success: false });

   const count = await Models.Files.destroy({
      where: { id: fileId, DisplayID: displayId }
   });

   if (count === 0) return res.json({ success: false });

   await RoutesCommon.Mqtt.SendUpdateSignal(displayId);
   await RemoveFilesNotInDB();
   return res.json({ success: true });
});

Files.get('/upload/', RoutesCommon.IsAuthenticated, async (_req, res) => {
   return RoutesCommon.NoCaching(res).render('ImageUpload.html');
});

// Controls if File is Hidden or Not
Files.put('/shown', RoutesCommon.IsAuthenticated, async (req, res) => {
   try {
      const params = RoutesCommon.GetParameters(req);
      const fileId = Number(params.file);
      const displayId = Number(params.id);
      const show = String(params.show) === 'true';

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
   }
   return res.json({ success: false });
});

Files.get('/thumbnail', RoutesCommon.IsAuthenticated, async (req, res) => {
   try {
      const params = RoutesCommon.GetParameters(req);
      const fileId = Number(params.file);
      const displayId = Number(params.id);

      const file = await Models.Files.findOne({
         where: { id: fileId, DisplayID: displayId }
      });
      if (!file) return res.sendStatus(404);

      if (!(await Models.Mongo.File.Exists(file.ThumbnailName))) return res.sendStatus(404);
      await Models.Mongo.File.Download(res, file.ThumbnailName);
      return null;
   } catch (err) {
      console.error(err);
      return res.sendStatus(404);
   }
});

Files.post('/download/list', RoutesCommon.ValidateActualDisplay, async (req, res) => {
   const params = RoutesCommon.GetParameters(req);
   const displayId = Number(params.id);

   const files = await Models.Files.findAll({
      attributes: ['id', 'Extension', 'FileHash'],
      where: { DisplayID: displayId, Downloaded: false }
   });

   const list: unknown[] = [];
   for (const file of files)
      list.push({
         id: file.id,
         Name: file.FileHash,
         Extension: file.Extension
      });

   return res.json({ success: true, data: list });
});

async function DownloadFile(req, res) {
   const params = RoutesCommon.GetParameters(req);
   const fileId = Number(params.file);
   const displayId = Number(params.id);

   const file = await Models.Files.findOne({
      where: { id: fileId, DisplayID: displayId, Downloaded: false }
   });

   if (!file) res.sendStatus(404);
   else if (!(await Models.Mongo.File.Exists(file.FileName))) res.sendStatus(404);
   else await Models.Mongo.File.Download(res, file.FileName);
}

Files.post('/download/file', RoutesCommon.ValidateActualDisplay,DownloadFile );

Files.get('/download/file/:id/:file', RoutesCommon.ValidateActualDisplay, DownloadFile);

Files.post('/list/filesFX', RoutesCommon.ValidateActualDisplay, async (req, res) => {
   try {
      const params = RoutesCommon.GetParameters(req);

      if (params == null)
         return res.json({
            success: false,
            data: []
         });
      const id = Number(params.id);

      const data: unknown[] = [];
      const files = await Models.Files.findAll({
         where: { DisplayID: id },
         order: [['id', 'ASC']]
      });

      for (const file of files)
         data.push({
            file: file.id,
            Path: file.FileName,
            Start: file.TimeStart,
            End: file.TimeEnd,
            ShowTime: file.ShowTime,
            OnDisplay: file.OnDisplay
         });

      return res.json({ success: true, data: data });
   } catch (err) {
      console.error(err);
   }
   return res.json({
      success: false,
      data: []
   });
});
