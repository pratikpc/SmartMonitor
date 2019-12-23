import { Request, Response, NextFunction } from "express";
import * as mqtt from "mqtt";
import { createHash, randomBytes } from "crypto";
import * as fs from "fs";
import { promises as FsPromises } from "fs";
import * as Models from "../Models/Models";
import ffmpeg = require("fluent-ffmpeg");
import * as multer from "multer";
import * as sharp from "sharp";
import * as Config from "../config/Config";
import * as Path from "path";
import { Readable } from "stream";
const GIFInfo = require('gif-info');

const storage = multer.diskStorage({
  destination: async (request: any, file: any, callback: any) => {
    const dir = Config.Server.MediaStorage;
    await RoutesCommon.File.DirectoryCreate(dir);
    callback(null, dir);
  },
  filename: (request: any, file: any, callback: any) => {
    let fileName = "";
    while (true) {
      const name = randomBytes(12).toString("hex");
      const ext = Path.extname(file.originalname).toLowerCase();
      fileName = name + ext;
      if (!fs.existsSync(fileName)) break;
    }

    callback(null, fileName);
  }
});
export const upload = multer.default({
  storage: storage,
  // Set File Size Limit of 25 MB
  limits: { fileSize: 1024 * 1024 * 25 }
});

export namespace RoutesCommon {
  export namespace File {

    export async function Exists(filepath: string) {
      try {
        await FsPromises.access(filepath);
      } catch (ex) {
        // If File Not exists, Exception Thrown
        return false;
      }
      return true;
    }

    export async function RemoveSingle(location: string) {
      try {
        await FsPromises.unlink(location);
      } catch (ex) {
      }
    }

    export async function Read(location: string) {
      const buffer = await FsPromises.readFile(location);
      return buffer;
    }

    export async function RemoveAll(location: string) {
      const files = await File.DirectoryList(location);
      await RemoveMultiple(files);
    }

    export function RemoveMultiple(locations: string[]) {
      const removalAsyncs: Promise<void>[] = [];
      for (const location of locations) {
        removalAsyncs.push(RemoveSingle(location));
      }
      return Promise.all(removalAsyncs);
    }
    export async function DirectoryCreate(location: string) {
      // If Directory exists, exception thrown
      try {
        await FsPromises.mkdir(location);
      } catch (ex) {
      }
    }

    export async function DirectoryList(location: string) {
      let paths = await FsPromises.readdir(location);
      paths = paths.map(path => Path.resolve(location, path));
      return paths;
    }
  }
}
export namespace RoutesCommon {
  export namespace Mqtt {
    export const Client = mqtt.connect(Config.Mqtt.Url);

    export function Publish(topic: string, message: string | Buffer) {
      return new Promise((resolve, reject) => {
        Mqtt.Client.publish(topic, message, (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
    }

    Mqtt.Client.on("connect", () => {
      console.log("Mqtt Connected", String(Mqtt.Client.options.host));
    });
    export async function Send(id: number, message: string) {
      if (Mqtt.Client.connected)
        await Mqtt.Publish(Config.Mqtt.DisplayTopic(id), message);
    }

    export function SendDownloadRequest(id: number) {
      return Mqtt.Send(id, "DN");
    }
    export function SendUpdateSignal(id: number) {
      return Mqtt.Send(id, "UE");
    }
    export function SendUpdateSignals(ids: number[]) {
      const promises: Promise<void>[] = [];
      for (const id of ids)
        promises.push(SendUpdateSignal(id));
      return Promise.all(promises);
    }
    export function SendDownloadRequests(ids: number[]) {
      const promises: Promise<void>[] = [];
      for (const id of ids)
        promises.push(SendDownloadRequest(id));
      return Promise.all(promises);
    }
  }
}
export namespace RoutesCommon {
  export namespace Validate {
    export function Display(
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
        else res.json({ success: false });
      });
    }

    // Check if Authentication is Correct
    export function User(
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      if (req.isAuthenticated()) return next();
      return res.redirect("/");
    }

    // Check if User is Admin
    export function Admin(req: Request, res: Response, next: NextFunction) {
      if (req.isAuthenticated() && RoutesCommon.GetUser(req).Authority === "ADMIN") return next();
      return res.redirect("/");
    }

    // Check if User is Not Admin
    export function NotAdmin(req: Request, res: Response, next: NextFunction) {
      if (req.isAuthenticated() && RoutesCommon.GetUser(req).Authority !== "ADMIN") return next();
      return res.redirect("/");
    }
  }
}
export namespace RoutesCommon {

  export function GetUser(req: Request) {
    return req.user! as Models.UserViewModel;
  }

  export function NoCaching(req: Request, res: Response, next: NextFunction) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return next();
  }

  export function GetSHA256FromFileAsync(path: string) {
    return new Promise<string>((resolve, reject) => {
      const hash = createHash("sha256");
      const rs = fs.createReadStream(path);
      rs.on("error", reject);
      rs.on("data", chunk => hash.update(chunk));
      rs.on("end", () => resolve(hash.digest("hex")));
    });
  }

  export async function GetFileSizeInBytes(filename: string) {
    const stats = await FsPromises.stat(filename);
    return stats.size;
  }

  // Convert Given Data as Array of Type
  export function ToArray(data: any): number[] {
    // If Null, Return Empty Array
    if (data == null) {
      return [];
    }
    // If it's already an array perform type conversion
    else if (Array.isArray(data)) {
      return data.map(Number);
    } else {
      // If it's Element, send as first value
      const value = Number(data);
      return [value];
    }
  }

  export function ConvertStringToIntegralGreaterThanMin(
    data: string,
    min: number
  ): number {
    const val = Number(data);
    if (val == null || Number.isNaN(val) || val < min) return min;
    return val;
  }

  function IsNotEmptyAny(object: any): boolean {
    return object && Object.keys(object).length !== 0;
  }
  export function GetParameters(req: Request): any {
    if (IsNotEmptyAny(req.body)) return req.body;
    if (IsNotEmptyAny(req.query)) return req.query;
    if (IsNotEmptyAny(req.params)) return req.params;
    return null;
  }

  // Converts time provided in hh:mm format to
  // Decimal
  // 10:45 becomes 1045
  export function TimeToDecimal(decimal: string) {
    if (decimal == null) return 0;
    // Get First 2 Array Elements
    const arr = decimal.split(":");
    if (arr.length !== 2) return 0;
    const hh = Number(arr[0]);
    const mm = Number(arr[1]);
    return hh * 100 + mm;
  }
}
export namespace RoutesCommon {
  export namespace GIF {
    export async function Info(path: string) {
      const nodeBuffer = await File.Read(path);
      // As ArrayBugger is also a UINt8Array buffer
      const buffer = new Uint8Array(nodeBuffer).buffer;
      const info = GIFInfo(buffer);
      return info;
    }
    export async function IsAnimated(path: string) {
      const info = await GIF.Info(path);
      return Boolean(info.animated);
    }
    export async function Duration(path: string, showTime: number) {
      const info = await GIF.Info(path);
      if (info.animated) {
        // Duration Returned is in Millis
        // Converted to seconds
        // As we are using Seconds
        return Number(info.duration) / 1000.0;
      }
      return showTime;
    }
  }
}
export namespace RoutesCommon {

  export function GenerateThumbnailAsync(
    path: string,
    mediaType: string,
    thumbnailName: string,
    width: number = Config.Thumbnail.Width,
    height: number = Config.Thumbnail.Height
  ) {
    if (mediaType === "VIDEO")
      return GenerateThumbnailVideoAsync(
        path,
        thumbnailName,
        width,
        height
      );
    if (mediaType === "IMAGE")
      return GenerateThumbnailImageAsync(
        path,
        thumbnailName,
        width,
        height
      );
    else
      return null;
  }

  function GenerateThumbnailImageAsync(
    sourceName: string,
    thumbnailName: string,
    width: number,
    height: number
  ) {

    const destName = Path.join(Path.dirname(sourceName), thumbnailName);

    return sharp
      .default(sourceName)
      .resize(width, height, {
        kernel: sharp.kernel.nearest,
        fit: sharp.fit.fill
      })
      .toFile(destName);
  }
  function GenerateThumbnailVideoAsync(
    videoPath: string,
    thumbnailName: string,
    width: Number,
    height: Number,
    moment: string = "50%"
  ) {
    const wxh = width + "x" + height;

    return new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath).thumbnails({
        count: 1,
        filename: thumbnailName,
        folder: Path.dirname(videoPath),
        size: wxh,
        // Take Thumbnail at Half Time
        timestamps: [moment]
      })
        .on("end", () => resolve())
        .on("error", err => reject(err));
    });
  }

  export function VideoConvertToWebM(
    videoSrc: string
  ) {
    // Append video to Hash of Name
    // Done because
    // For an MP4 file, we can't write into same file
    // Again
    const videoSrcSplit = Path.parse(videoSrc);
    const videoDest = Path.join(videoSrcSplit.dir, videoSrcSplit.name + "video.webm");

    // Make this given function awaitable
    // This way, the interface becomes easier to implement
    // And Understand
    // And we can introduce a blocking call
    return new Promise<void>((resolve, reject) => {
      ffmpeg(videoSrc)
        .format("webm")
        .videoCodec("libvpx")
        .noAudio()
        .output(videoDest)
        .on("end", () => resolve())
        .on("error", err => reject(err))
        .run();
    });
  }

  export function GIFConvertToWebM(gifSrc: string) {
    const gifSrcSplit = Path.parse(gifSrc);
    const gifDest = Path.join(gifSrcSplit.dir, gifSrcSplit.name + "video.webm");

    return new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(gifSrc)
        .inputFormat("gif")
        .outputOptions(['-pix_fmt yuv420p', '-movflags frag_keyframe+empty_moov', '-movflags +faststart'])
        .videoCodec('libvpx')
        .format('webm')
        .on('error', (error: any) => {
          reject(error);
        }).
        on('end', function () {
          resolve();
        })
        .output(gifDest)
        .run();
    });

  }

  export function ConvertImageToVideo(
    res: Response,
    imageStream: Readable,
    duration: number
  ) {
    // Convert the Given Image to a Video
    return new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(imageStream)
        .inputFPS(1)
        .outputFPS(1)
        .videoCodec('libvpx')
        .videoBitrate(1024)
        .format('webm')
        .size('640x480')
        .loop(1)
        .setDuration(duration)
        .noAudio()
        .outputOptions(['-pix_fmt yuv420p', '-frag_duration 100', '-movflags frag_keyframe+faststart'])
        .on('error', (error: any) => {
          console.log("3233", error);
          res.sendStatus(404);
          reject(error);
        }).
        on('end', function () {
          console.log("3313");
          res.end();
          resolve();
        })
        .output(res, { end: true })
        .run();
    });
  }
}
