import { Request, Response, NextFunction } from "express";
import * as mqtt from "mqtt";
import { createHash, randomBytes } from "crypto";
import * as fs from "fs";
import { promises as FsPromises } from "fs";
import { join, extname } from "path";
import * as Models from "../Models/Models";
import ffmpeg = require("fluent-ffmpeg");
import * as multer from "multer";
import * as mime from "mime";
import * as sharp from "sharp";
import * as Config from "../config/Config";
import * as Path from "path";
import * as process from "process";
const GIFInfo = require('gif-info');

const storage = multer.diskStorage({
  destination: async (request: any, file: any, callback: any) => {
    const dir = Path.resolve(String(process.env.INIT_CWD), 'uploads');
    await RoutesCommon.CreateDirectoryIfNotExistsAsync(dir);
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
export const upload = multer.default({
  storage: storage,
  // Set File Size Limit of 25 MB
  limits: { fileSize: 1024 * 1024 * 25 }
});

export namespace RoutesCommon {
  export const MqttClient = mqtt.connect(Config.Mqtt.Url);

  MqttClient.on("connect", async () => {
    console.log("Mqtt Connected ", Config.Mqtt.Url);
  });


  export async function CreateDirectoryIfNotExistsAsync(location: string) {
    return new Promise<void>((resolve, reject) => {
      FsPromises.access(location, fs.constants.R_OK).then(() => {
        resolve();
        // Do Nothing if Exists
      }).catch((err) => {
        FsPromises.mkdir(location)
          .then(() => { resolve(); })
          .catch((err) => { reject(err) });
      });
    });
  }


  export async function RemoveFileAsync(location: string) {
    await FsPromises.unlink(location);
  }

  export function RemoveFilesAsync(locations: string[]) {
    const removalAsyncs: Promise<void>[] = [];
    for (const location of locations) {
      removalAsyncs.push(RemoveFileAsync(location));
    }
    return Promise.all(removalAsyncs);
  }

  export function ListOfFiles(location: string) {
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(location, (err, files) => {
        if (err)
          reject(err);
        else {
          // Convert to Absolute paths
          files = files.map(file => Path.resolve(location, file));
          resolve(files);
        }
      })
    });
  }

  export function ValidateActualDisplay(
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
  export function IsAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (req.isAuthenticated()) return next();
    return res.redirect("/");
  }

  // Check if User is Admin
  export function IsAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated() && req.user.Authority === "ADMIN") return next();
    return res.redirect("/");
  }

  // Check if User is Not Admin
  export function IsNotAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated() && req.user.Authority !== "ADMIN") return next();
    return res.redirect("/");
  }

  export function SendMqttMessage(id: number, message: string): void {
    if (MqttClient.connected)
      MqttClient.publish(Config.Mqtt.DisplayTopic(id), message);
  }

  export function SendMqttClientDownloadRequest(id: number) {
    SendMqttMessage(id, "DN");
  }
  export function SendMqttClientUpdateSignal(id: number) {
    SendMqttMessage(id, "UE");
  }

  export function GetSHA256FromFileAsync(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash("sha256");
      const rs = fs.createReadStream(path);
      rs.on("error", reject);
      rs.on("data", chunk => hash.update(chunk));
      rs.on("end", () => resolve(hash.digest("hex")));
    });
  }

  export function GetFileSizeInBytes(filename: string) {
    const stats = fs.statSync(filename);
    const fileSizeInBytes = stats["size"];
    return fileSizeInBytes;
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

  // Find Multimedia type based on File Extension
  export function GetFileMediaType(ext: string): string | null {
    const mimeType = mime.getType(ext);
    if (!mimeType) return null;
    if (mimeType.startsWith("image")) return "IMAGE";
    if (mimeType.startsWith("video")) return "VIDEO";
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

  export function GIFDuration(location: string, name: string, extension: string, showTime: number) {
    const path = Path.join(location, name + "." + extension);
    const nodeBuffer = fs.readFileSync(path);
    // As ArrayBugger is also a UINt8Array buffer
    const buffer = new Uint8Array(nodeBuffer).buffer;
    const info = GIFInfo(buffer);
    if (info.animated){
      // Duration Returned is in Millis
      // Converted to seconds
      // As we are using Seconds
      return Number(info.duration) / 1000.0;
    }
    return showTime;
  }

  export async function GenerateThumbnailAsync(
    location: string,
    name: string,
    extension: string,
    mediaType: string,
    thumbnailName: string,
    width: number = Config.Thumbnail.Width,
    height: number = Config.Thumbnail.Height
  ) {
    const filename = name + "." + extension;
    if (mediaType === "VIDEO")
      return await GenerateThumbnailVideoAsync(
        location,
        filename,
        thumbnailName,
        width,
        height
      );
    if (mediaType === "IMAGE")
      return await GenerateThumbnailImageAsync(
        location,
        filename,
        thumbnailName,
        width,
        height
      );
  }
  async function GenerateThumbnailImageAsync(
    location: string,
    imageName: string,
    thumbnailName: string,
    width: number,
    height: number
  ) {
    const sourceName = join(location, imageName);
    const destName = join(location, thumbnailName);

    return await sharp
      .default(sourceName)
      .resize(width, height, {
        kernel: sharp.kernel.nearest,
        fit: "contain",
        position: "right top"
      })
      .toFile(destName);
    ;
  }
  async function GenerateThumbnailVideoAsync(
    location: string,
    videoName: string,
    thumbnailName: string,
    width: Number,
    height: Number,
    moment: string = "50%"
  ) {
    const videoPath = join(location, videoName);
    const wxh = width + "x" + height;

    return await new Promise<boolean>((resolve, reject) => {
      ffmpeg(videoPath).thumbnails({
        count: 1,
        filename: thumbnailName,
        folder: location,
        size: wxh,
        // Take Thumbnail at Half Time
        timestamps: [moment]
      })
        .on("end", () => resolve(true))
        .on("error", err => reject(err));
    });
  }

  export function NoCaching(res: Response) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res;
  }

  export function VideoChangeFormatToH264(
    location: string,
    videoName: string,
    videoExt: string
  ) {
    const videoSrc = join(location, videoName + "." + videoExt);
    // Append video to Hash of Name
    // Done because
    // For an MP4 file, we can't write into same file
    // Again
    const videoDest = join(location, videoName + "video.mp4");

    // Make this given function awaitable
    // This way, the interface becomes easier to implement
    // And Understand
    // And we can introduce a blocking call
    return new Promise<boolean>((resolve, reject) => {
      ffmpeg(videoSrc)
        .format("mp4")
        .videoCodec("libx264")
        .noAudio()
        .saveToFile(videoDest)
        .on("end", () => resolve(true))
        .on("error", err => reject(err));
    });
  }
}
