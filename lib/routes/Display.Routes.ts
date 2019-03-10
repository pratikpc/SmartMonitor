import * as Model from "../Models/Models";
import { Router, Request, Response, NextFunction } from "express";

export const Displays = Router();

Displays.post("/", isAdmin, async (req, res, next) => {
  const displayName = req.body.displayname;
  const userId = Number(req.user.id);

  if (!displayName || !userId)
    return res.json({
      success: false
    });

  const newDisplay = await Model.Displays.create({
    Name: displayName,
    CreatingUserID: userId
  });

  if (newDisplay == null)
    return res.json({
      success: false
    });

  return res.json({
    success: true,
    id: newDisplay.id,
    Name: newDisplay.Name,
    CreatingUserID: newDisplay.CreatingUserID,
    IdentifierKey: newDisplay.IdentifierKey
  });
});

Displays.put("/", isAdmin, async (req, res, next) => {
  const displayId = Number(req.body.displayid);
  const displayKey = String(req.body.displaykey);
  const userId = Number(req.user.id);

  const newDisplayName = String(req.body.displayname);

  const [count, displays] = await Model.Displays.update(
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

Displays.get("/", isAuthenticated, async (req, res, next) => {
  const displays = await Model.Displays.findAll({
    attributes: ["id", "Name"],
    order: [["id", "ASC"]]
  });
  const list: any[] = [];
  displays.forEach(display => {
    list.push({ id: display.id, name: display.Name });
  });
  return res.json(list);
});

Displays.get(
  "/:id",
  isAuthenticated,
  async (req, res, next) => {
    const id = Number(req.params.id);

    const display = await Model.Displays.findById(id, {
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
  }
);

// Check if Authentication is Correct
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.redirect("/user/login/");
}

// Check if User is Admin
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.Authority === "ADMIN") return next();
  res.redirect("/user/login/");
}
