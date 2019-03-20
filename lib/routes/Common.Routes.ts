import { Request, Response, NextFunction } from "express";
import * as mqtt from "mqtt";
import * as Config from "../config/Mqtt";
import { createHash } from "crypto";
import { createReadStream } from "fs";

export namespace RoutesCommon {
  export const MqttClient = mqtt.connect(Config.Mqtt.Url);

  MqttClient.on("connect", async () => {
    console.log("Mqtt Connected ", Config.Mqtt.Url);
  });
  // Check if Authentication is Correct
  export function IsAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (req.isAuthenticated()) return next();
    res.redirect("/user/login");
  }

  export function GetSHA256FromFile(path: string) : Promise<string> {
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
}
