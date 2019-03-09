import * as Model from "../Models/Models";
import { Router } from "express";

export const Displays = Router();

Displays.post("/register/", async (req, res, next) => {
  const displayName = req.query.displayname;
  const userId = Number(req.query.userid);

  console.log(displayName, userId);

    if (!displayName || !userId)
      return res.json({
        success: false
      });

  const user = await Model.Users.findOne({ where: { id: userId } });

  if (!user)
    return res.json({
      success: false
    });
  
  const authority = user!.Authority;
  if (authority !== 'ADMIN') 
    return res.json({
      success: false
    });

  const creatingUserID = user!.id;
  const newDisplay = await Model.Displays.create({
    Name: displayName,
    CreatingUserID: creatingUserID
  });

  return res.json({
    success: true,
    Name: newDisplay!.Name,
    CreatingUserID: newDisplay!.CreatingUserID,
    IdentifierKey: newDisplay!.IdentifierKey,

  });
});

Displays.put("/register/", async (req, res, next) => {
  const displayId = Number(req.query.displayid);
  const displayKey = String(req.query.displaykey);
  const userId = Number(req.query.userid);

  const displayName = String(req.query.displayname);

  const user = await Model.Users.findOne({ where: { id: userId } });

  if (!user)
    return res.json({
      success: false,
      authentication: false,
      authority: false,
      id: null,
      key: null
    });

  const authority = user!.Authority;
  if (authority !== "ÁDMIN")
    return res.json({
      success: false,
      authentication: true,
      authority: false,
      id: null
    });

  const display = await Model.Displays.update(
    { Name: displayName },
    {
      where: {
        id: displayId,
        CreatingUserID: userId,
        IdentifierKey: displayKey
      }
    }
  );
});

Displays.get("/", async (req, res, next) => {
  const displays = await Model.Displays.findAll({ attributes: ["id", "Name"] });
  const list: any[] = [];
  displays.forEach(display => {
    list.push({ id: display.id, name: display.Name });
  });
  return res.json(list);
});

Displays.get("/:id", async (req, res, next) => {
  const id = Number(req.params.id);

  const display = await Model.Displays.findOne({ where: { id: id } });
  if (display)
    return res.json({
      success: true,
      data: { id: display!.id, name: display!.Name }
    });
  return res.json({
    success: false,
    data: { id: id, name: null }
  });
});
