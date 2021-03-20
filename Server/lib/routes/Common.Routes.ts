import type { Request, Response, NextFunction } from 'express';
import mqtt from 'mqtt';
import { createHash } from 'crypto';
import fs, { promises as FsPromises } from 'fs';

import mime from 'mime';
import sharp from 'sharp';
import Path from 'path';
import ffmpeg from 'fluent-ffmpeg';

import * as Config from '../config';
import * as Models from '../Models';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const GIFInfo = require('gif-info');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// function IsNotEmptyAny(object: any): boolean {
//    return object && Object.keys(object).length !== 0;
// }
function GenerateThumbnailImageAsync(sourceName: string, thumbnailName: string, width: number, height: number) {
   const destName = Path.join(Path.dirname(sourceName), thumbnailName);

   return sharp(sourceName)
      .resize(width, height, {
         kernel: sharp.kernel.nearest,
         fit: sharp.fit.fill
      })
      .toFile(destName);
}
function GenerateThumbnailVideoAsync(
   videoPath: string,
   thumbnailName: string,
   width: number,
   height: number,
   moment = '50%'
) {
   const wxh = `${width}x${height}`;

   return new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
         .thumbnails({
            count: 1,
            filename: thumbnailName,
            folder: Path.dirname(videoPath),
            size: wxh,
            // Take Thumbnail at Half Time
            timestamps: [moment]
         })
         .on('end', () => resolve())
         .on('error', err => reject(err));
   });
}

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
            // It's Fine if Not Removed
            // If it Does Not Exist
         }
      }

      export async function Read(location: string) {
         const buffer = await FsPromises.readFile(location);
         return buffer;
      }

      export async function RemoveMultiple(locations: string[]) {
         const removalAsyncs: Promise<void>[] = [];
         for (const location of locations) {
            removalAsyncs.push(RemoveSingle(location));
         }
         return await Promise.all(removalAsyncs);
      }
      export async function RemoveAll(location: string) {
         const files = await File.DirectoryList(location);
         return await RemoveMultiple(files);
      }

      export async function DirectoryCreate(location: string) {
         // If Directory exists, exception thrown
         try {
            await FsPromises.mkdir(location);
         } catch (ex) {
            // It's Fine if Directory already Exists
         }
      }

      export async function DirectoryList(location: string) {
         let paths = await FsPromises.readdir(location);
         paths = paths.map(path => Path.resolve(location, path));
         return paths;
      }
   }
   export namespace Mqtt {
      export const Client = mqtt.connect(Config.Mqtt.Url, { clientId: '22' });

      export function Publish(topic: string, message: string | Buffer) {
         return new Promise((resolve, reject) => {
            Mqtt.Client.publish(topic, message, (err, result) => {
               if (err) reject(err);
               else resolve(result);
            });
         });
      }

      Mqtt.Client.on('connect', () => {
         console.info('Mqtt Connected', Mqtt.Client.options.host);
      });
      export async function Send(id: number, message: string) {
         if (Mqtt.Client.connected) await Mqtt.Publish(Config.Mqtt.DisplayTopic(id), message);
      }

      export function SendDownloadRequest(id: number) {
         return Mqtt.Send(id, 'DN');
      }
      export function SendUpdateSignal(id: number) {
         return Mqtt.Send(id, 'UE');
      }
      export function SendUpdateSignals(ids: number[]) {
         const promises: Promise<void>[] = [];
         for (const id of ids) promises.push(SendUpdateSignal(id));
         return Promise.all(promises);
      }
      export function SendDownloadRequests(ids: number[]) {
         const promises: Promise<void>[] = [];
         for (const id of ids) promises.push(SendDownloadRequest(id));
         return Promise.all(promises);
      }
   }
   export function GetUser(req: Request) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return req.user! as Models.UserViewModel;
   }
   export function GetDisplay(req: Request) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return req.user! as Models.Displays;
   }

   // Check if Authentication is Correct
   export function IsAuthenticated(req: Request, res: Response, next: NextFunction) {
      if (req.isAuthenticated()) return next();
      return res.redirect('/');
   }
   // Check if User is Admin
   export function IsDisplay(req: Request, res: Response, next: NextFunction) {
      if (req.isAuthenticated() && (req.user as Models.Displays).CreatingUserID != null) return next();
      return res.redirect('/');
   }
   // Check if User is Admin
   export function IsAdmin(req: Request, res: Response, next: NextFunction) {
      if (req.isAuthenticated() && RoutesCommon.GetUser(req).Authority === 'ADMIN') return next();
      return res.redirect('/');
   }

   // Check if User is Not Admin
   export function IsNotAdmin(req: Request, res: Response, next: NextFunction) {
      if (req.isAuthenticated() && RoutesCommon.GetUser(req).Authority !== 'ADMIN') return next();
      return res.redirect('/');
   }

   export function GetSHA256FromFileAsync(path: string) {
      return new Promise<string>((resolve, reject) => {
         const hash = createHash('sha256');
         const rs = fs.createReadStream(path);
         rs.on('error', reject);
         rs.on('data', chunk => hash.update(chunk));
         rs.on('end', () => resolve(hash.digest('hex')));
      });
   }

   export async function GetFileSizeInBytes(filename: string) {
      const stats = await FsPromises.stat(filename);
      return stats.size;
   }

   // Convert Given Data as Array of Type
   export function ToArray(data: unknown): number[] {
      // If Null, Return Empty Array
      if (data == null) {
         return [];
      }
      // If it's already an array perform type conversion
      if (Array.isArray(data)) {
         return data.map(Number);
      }
      // If it's Element, send as first value
      const value = Number(data);
      return [value];
   }

   export function ConvertStringToIntegralGreaterThanMin(data: string, min: number): number {
      const val = Number(data);
      if (val == null || Number.isNaN(val) || val < min) return min;
      return val;
   }

   export function GetParameters(req: Request) {
      return { ...(req.body || {}), ...(req.query || {}), ...(req.params || {}) };
   }

   // Find Multimedia type based on File Extension
   export function GetFileMediaType(ext: string): string | null {
      const mimeType = mime.getType(ext);
      if (!mimeType) return null;
      if (mimeType.startsWith('image')) return 'IMAGE';
      if (mimeType.startsWith('video')) return 'VIDEO';
      return null;
   }

   // Converts time provided in hh:mm format to
   // Decimal
   // 10:45 becomes 1045
   export function TimeToDecimal(decimal: string) {
      if (decimal == null) return 0;
      // Get First 2 Array Elements
      const arr = decimal.split(':');
      if (arr.length !== 2) return 0;
      const hh = Number(arr[0]);
      const mm = Number(arr[1]);
      return hh * 100 + mm;
   }

   export async function GIFDuration(path: string, showTime: number) {
      const nodeBuffer = await File.Read(path);
      // As ArrayBugger is also a UINt8Array buffer
      const { buffer } = new Uint8Array(nodeBuffer);
      const info = GIFInfo(buffer);
      if (info.animated) {
         // Duration Returned is in Millis
         // Converted to seconds
         // As we are using Seconds
         return Number(info.duration) / 1000.0;
      }
      return showTime;
   }

   export function GenerateThumbnailAsync(
      path: string,
      mediaType: string,
      thumbnailName: string,
      width: number = Config.Thumbnail.Width,
      height: number = Config.Thumbnail.Height
   ) {
      if (mediaType === 'VIDEO') return GenerateThumbnailVideoAsync(path, thumbnailName, width, height);
      if (mediaType === 'IMAGE') return GenerateThumbnailImageAsync(path, thumbnailName, width, height);
      return null;
   }
   export function NoCaching(res: Response) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      return res;
   }

   export function VideoChangeFormatToBrowserBest(videoSrc: string) {
      // Append video to Hash of Name
      // Done because
      // For a WEBM file, we can't write into same file
      // Again
      const videoSrcSplit = Path.parse(videoSrc);
      const videoDest = Path.join(videoSrcSplit.dir, `${videoSrcSplit.name}video.webm`);

      // Make this given function awaitable
      // This way, the interface becomes easier to implement
      // And Understand
      // And we can introduce a blocking call
      return new Promise<void>((resolve, reject) => {
         ffmpeg(videoSrc)
            .format('webm')
            .videoCodec('libvpx-vp9')
            // .videoBitrate('1M')
            .noAudio()
            // .outputOption('-movflags faststart')
            // .outputOption('-strict -2')
            .output(videoDest)
            .on('end', () => resolve())
            .on('error', err => reject(err))
            .run();
      });
   }
}
