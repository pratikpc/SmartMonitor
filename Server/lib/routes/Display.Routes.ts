import * as Models from "../Models/Models";
import { randomBytes } from "crypto";
import { Router } from "express";
import { RoutesCommon } from "./Common.Routes";
import passport = require("passport");

export const Displays = Router();

Displays.get("/list", RoutesCommon.IsAuthenticated, (req, res) => {
  return RoutesCommon.NoCaching(res).render("displist.html");
});

Displays.post("/add/", passport.authenticate("app"), async (req, res) => {
  if (req.isUnauthenticated())
    return res.json({
      success: false
    });

  const userId = RoutesCommon.ConvertStringToIntegralGreaterThanMin(
    req.user.id,
    0 /*User ID never less than this*/
  );

  const params = RoutesCommon.GetParameters(req);
  const displayName = params.displayname;

  if (!displayName || !userId)
    return res.json({
      success: false
    });

  const newDisplay = await Models.Displays.create({
    Name: displayName,
    CreatingUserID: userId,
    IdentifierKey: randomBytes(20).toString("hex")
  });

  if (newDisplay == null)
    return res.json({
      success: false
    });

  return res.json({
    success: true,
    data: {
      id: newDisplay.id,
      Name: newDisplay.Name,
      CreatingUserID: newDisplay.CreatingUserID,
      IdentifierKey: newDisplay.IdentifierKey
    }
  });
});

Displays.put("/", RoutesCommon.IsAdmin, async (req, res) => {
  const userId = Number(req.user.id);

  const params = RoutesCommon.GetParameters(req);

  const displayId = Number(params.displayid);
  const displayKey = String(params.displaykey);
  const newDisplayName = String(params.displayname);

  const [count] = await Models.Displays.update(
    { Name: newDisplayName },
    {
      where: {
        id: displayId,
        CreatingUserID: userId,
        IdentifierKey: displayKey
      }
    }
  );

  // There should only be 1 Update
  if (count !== 1)
    return res.json({
      success: false
    });

  return res.json({
    success: true
  });
});

Displays.get("/", RoutesCommon.IsAuthenticated, async (req, res) => {
  const displays = await Models.Displays.findAll({
    attributes: ["id", "Name"],
    order: [["id", "ASC"]]
  });
  const list: any[] = [];
  displays.forEach(display => {
    list.push({ id: display.id, name: display.Name });
  });
  return res.json(list);
});

Displays.get("/:id", RoutesCommon.IsAuthenticated, async (req, res) => {
  const params = RoutesCommon.GetParameters(req);

  if (params == null)
    return res.json({
      success: false,
      data: { id: null, name: null }
    });
  const id = Number(params.id);

  try {
    const display = await Models.Displays.findByPk(id, {
      attributes: ["id", "Name"]
    });
    if (display)
      return res.json({
        success: true,
        data: { id: display.id, name: display.Name }
      });

    return res.json({
      success: false,
      data: { id: null, name: null }
    });
  } catch (err) {
    console.error(err);
    return res.json({
      success: false,
      data: { id: null, name: null }
    });
  }
});

Displays.get("/:id/files", RoutesCommon.IsAdmin, async (req, res) => {
  try {
    const params = RoutesCommon.GetParameters(req);

    if (params == null)
      return res.json({
        success: false,
        data: null
      });
    const id = Number(params.id);

    const data: any[] = [];
    const files = await Models.Files.findAll({
      where: { DisplayID: id },
      order: [["id", "ASC"]]
    });

    files.forEach(file => {
      data.push({
        file: file.id,
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
});

Displays.delete("/", RoutesCommon.ValidateActualDisplay, async (req, res) => {
  try {
    const params = RoutesCommon.GetParameters(req);
    if (params == null)
      return res.json({
        success: false
      });
    const id = Number(params.id);

    const displayDel = await Models.Displays.destroy({ where: { id: id } });
    await Models.Files.destroy({ where: { DisplayID: id } });

    if (displayDel !== 0) return res.json({ success: true });
  } catch (error) {
    console.error(error);
  }
  return res.json({
    success: false
  });
});
