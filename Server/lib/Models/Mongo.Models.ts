import * as MongoDB from "mongodb";
import * as Config from "../config";
import { createReadStream } from "fs";

export namespace Mongo {
  export const Client = new MongoDB.MongoClient(Config.Mongo.Uri(), {
    useUnifiedTopology: true,
  });
  export let DB: MongoDB.Db;
  export let GridFsBucket: MongoDB.GridFSBucket;
  export let GridFsCollection: MongoDB.Collection<any>;

  export async function Connect() {
    await Mongo.Client.connect();
    Mongo.DB = Mongo.Client.db(Config.Mongo.DatabaseName);
    Mongo.GridFsBucket = new MongoDB.GridFSBucket(Mongo.DB, {
      bucketName: Config.Mongo.Bucket,
    });
    Mongo.GridFsCollection = Mongo.DB.collection(Config.Mongo.Bucket_Files);
    console.info("Mongo Connected at ", Config.Mongo.Uri());
  }

  export namespace File {
    export function GetCursor(fileName: string) {
      const file = Mongo.GridFsBucket.find({ filename: fileName }).limit(1);
      return file;
    }
    export async function GetAll() {
      const cursor = Mongo.GridFsBucket.find();
      const fileObjs = await cursor.toArray();
      const files = fileObjs.map((file) => String(file.filename));
      return files;
    }

    export function UploadSingle(path: string, fileName: string) {
      return new Promise<void>((resolve, reject) => {
        createReadStream(path)
          .pipe(GridFsBucket.openUploadStream(fileName))
          .on("error", (error: any) => {
            reject(error);
          })
          .on("finish", function () {
            resolve();
          });
      });
    }

    export function Download(res: any, fileName: string) {
      return new Promise<void>((resolve, _reject) => {
        return GridFsBucket.openDownloadStreamByName(fileName)
          .pipe(res)
          .on("error", (_error: any) => {
            res.sendStatus(404);
            resolve();
          })
          .on("finish", function () {
            resolve();
          });
      });
    }

    export async function Get(fileName: string) {
      const files = await File.GetCursor(fileName).toArray();
      return files[0];
    }

    export async function Size(fileName: string) {
      const file = await File.Get(fileName);
      return file.length;
    }
    export async function Exists(fileName: string) {
      const file = File.GetCursor(fileName);
      const count = await file.count();
      return count !== 0;
    }

    export async function DeleteById(id: MongoDB.ObjectID) {
      return new Promise<void>((resolve, reject) => {
        GridFsBucket.delete(id, (err) => {
          if (err == null) resolve();
          else reject(err);
        });
      });
    }

    export async function RemoveSingle(fileName: string) {
      const file = await File.Get(fileName);
      const id = file._id;
      await Mongo.File.DeleteById(id);
    }

    export function RemoveMultiple(locations: string[]) {
      const removalAsyncs: Promise<void>[] = [];
      for (const location of locations)
        removalAsyncs.push(File.RemoveSingle(location));
      return Promise.all(removalAsyncs);
    }
  }
}
