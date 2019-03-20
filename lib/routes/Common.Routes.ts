import { Request, Response, NextFunction } from "express";
import * as mqtt from "mqtt";
import * as Config from "../config/Mqtt";
import { createHash, randomBytes } from "crypto";
import { createReadStream, existsSync, mkdirSync } from "fs";
import { join, extname } from "path";
import ffmpeg = require('fluent-ffmpeg');
import * as multer from "multer";


const storage = multer.diskStorage({
  destination: (request: any, file: any, callback: any) => {
    const dir = "./uploads";
    if (!existsSync(dir)) mkdirSync(dir);
    callback(null, dir);
  },
  filename: (request: any, file: any, callback: any) => {
    let fileName = "";
    while (true) {
      const name = randomBytes(12).toString("hex");
      const ext = extname(file.originalname);
      fileName = name + ext;
      if (!existsSync(fileName)) break;
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

  export function SendMqttMessage(id: number, message: string): void {
    MqttClient.publish(Config.Mqtt.DisplayTopic(id), message);
  }

  export function SendMqttClientDownloadRequest(id: number) {
    SendMqttMessage(id, "DN");
  }
  export function SendMqttClientUpdateSignal(id: number) {
    SendMqttMessage(id, "UE");
  }

  // Check if Authentication is Correct
  export function IsAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (req.isAuthenticated()) return next();
    res.redirect("/user/login");
  }

  export function GetSHA256FromFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash("sha256");
      const rs = createReadStream(path);
      rs.on("error", reject);
      rs.on("data", chunk => hash.update(chunk));
      rs.on("end", () => resolve(hash.digest("hex")));
    });
  }

  // Convert Given Data as Array of Type
  export function GetDataAsArray<T>(data: any) {
    // If Null, Return Empty Array
    if (data == null) {
      return [];
    }
    // If it's already an array perform type conversion
    else if (Array.isArray(data)) {
      return data as T[];
    } else {
      // If it's Element, send as first value
      const value = data as T;
      return [value];
    }
  }

  // Check if User is Admin
  export function IsAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated() && req.user.Authority === "ADMIN") return next();
    res.redirect("/user/login");
  }

  // Check if User is Not Admin
  export function IsNotAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated() && req.user.Authority !== "ADMIN") return next();
    res.redirect("/user/login");
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
    switch (ext) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "IMAGE";
      case "mp4":
        return "VIDEO";
      default:
        return null;
    }
  }
  export function GenerateThumbnail(
    location: string,
    videoName: string,
    thumbnailName: string,
    moment: string = "50%",
    size: string = "320x240"
  ) {
    const videoPath = join(location, videoName);

    ffmpeg(videoPath)
      .thumbnails({
        count: 1,
        filename: thumbnailName,
        folder: location,
        size: size,
        // Take Thumbnail at Half Time
        timestamps: [moment]
      })
      .run();
  }
}
