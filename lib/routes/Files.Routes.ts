import { Router, Request, Response, NextFunction } from "express";
import { RoutesCommon } from "./Common.Routes";
import * as Models from "../Models/Models";

export const Files = Router();

Files.get("/download/list", ValidateActualDisplay, async (req, res) => {
  const params = RoutesCommon.GetParameters(req);
  const displayId = Number(params.id);

  const files = await Models.Files.findAll({
    where: { DisplayID: displayId }
  });

  const list: any[] = [];
  files.forEach(file => {
      list.push({id: file.id});
  });
  return res.json(list);
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
    where: { id: fileId, DisplayID: displayId }
  });

  if (!file) return res.json({ success: false });

  const path = file.PathToFile;

  return res.download(path);
});

async function ValidateActualDisplay(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const params = RoutesCommon.GetParameters(req);
  const id = Number(params.id);
  const key = String(params.key);

  const count = await Models.Displays.count({
    where: { id: id, IdentifierKey: key }
  });

  if (count !== 0) return next();
  else res.json({ success: false });
}
