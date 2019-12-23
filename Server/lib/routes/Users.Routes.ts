import { Router, Request, Response, NextFunction } from "express";
import * as Model from "../Models/Users.Model";
import { randomBytes } from "crypto";
import passport from "passport";
import { RoutesCommon } from "./Common.Routes";

export const Users = Router();

Users.get("/login/", (req, res) => {
  if (req.isUnauthenticated()) return res.render("login.html");
  const authority = String(RoutesCommon.GetUser(req).Authority);
  return res.redirect("/files/upload");
});
// This is the Uri
// By default when Post Request is Made
// Authenticate if this is an actual user
// If not, Perform Redirection
Users.post(
  "/login/",
  passport.authenticate("app", { failureRedirect: "/" }),
  (req, res) => {
    const authority = String(RoutesCommon.GetUser(req).Authority);
    return res.redirect("/files/upload");
  }
);

Users.post("/login/json", passport.authenticate("app"), (req, res) => {
  return res.json({ success: req.isAuthenticated() });
});

// Uri for Logout
Users.all("/logout/", RoutesCommon.Validate.User, (req, res) => {
  req.logout();
  return res.redirect("/");
});

Users.get("/list/", RoutesCommon.Validate.Admin, RoutesCommon.NoCaching, async (req, res) => {
  return res.render("userlist.html");
});

// This is the Uri for Registration of a new user
Users.post("/add/", RoutesCommon.Validate.Admin, async (req, res) => {
  try {
    const params = RoutesCommon.GetParameters(req);

    const name = String(params.name).trim();
    if (name == null) return res.json({ success: false, password: null });
    if (name === "") return res.json({ success: false, password: null });

    let authority = String(params.authority).trim().toUpperCase();
    if (authority == null || authority.trim() === "")
      authority = "NORMAL";

    const count_users = await Model.Users.count({ where: { Name: name } });

    if (count_users !== 0) return res.json({ success: false, password: null });

    // Generate Random Pass Key
    const pass_key = randomBytes(10).toString("hex");
    const new_user = await Model.Users.create({
      Name: name,
      Password: pass_key,
      Authority: authority
    });

    if (!new_user) return res.json({ success: false, password: null });

    return res.json({ success: true, password: pass_key });
  } catch (error) {
    return res.json({ success: false, password: null });
  }
});

// Display the Change Password Html Page
Users.get("/changepass/", RoutesCommon.Validate.User, RoutesCommon.NoCaching, (req, res) => {
  return res.render("ChangePass.html");
});

// This is the Uri for Updation of a User's details
// Get Old Password
// And Set Change to New Password
// Logically under REST rules it would be under PUT
// But it's probably not a good idea.
Users.post("/changepass/", RoutesCommon.Validate.User, async (req, res) => {
  try {
    const id = Number(RoutesCommon.GetUser(req).id);

    const params = RoutesCommon.GetParameters(req);
    const old_pass = String(params.old);
    const new_pass = String(params.new);

    const user = await Model.Users.findOne({ where: { id: id } });

    // Check if User Exists
    if (!user) return res.json({ success: false });
    // Check if Password Entered is Correct
    const match = await user!.ComparePassword(old_pass);
    if (!match) return res.json({ success: false });

    const [count, users] = await Model.Users.update(
      { Password: new_pass },
      { where: { id: id } }
    );

    if (count !== 1) return res.json({ success: false });
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false });
  }
});

// Use this to find Details of Current User
Users.get("/current/", async (req, res) => {
  const authority = String(RoutesCommon.GetUser(req).Authority);
  const name = String(RoutesCommon.GetUser(req).Name);
  const id = Number(RoutesCommon.GetUser(req).id);

  return res.json({ id: id, Name: name, Authority: authority });
});

// This is Uri to access List of Non Admin Users
Users.get("/", RoutesCommon.Validate.Admin, async (req, res) => {
  try {
    const users = await Model.Users.findAll({
      attributes: ["id", "Name"],
      where: { Authority: "NORMAL" }
    });
    const list: any[] = [];
    users.forEach(user => {
      list.push({ id: user.id, name: user.Name });
    });
    return res.json(list);
  } catch (error) {
    return res.json([]);
  }
});
Users.get("/:id", RoutesCommon.Validate.Admin, async (req, res) => {
  try {
    const params = RoutesCommon.GetParameters(req);
    const id = Number(params.id);
    const user = await Model.Users.findOne({
      attributes: ["id", "Name"],
      where: { id: id, Authority: "NORMAL" }
    });
    if (!user)
      return res.json({
        success: false,
        data: { id: null, name: null }
      });
    return res.json({
      success: true,
      data: { id: user.id, name: user.Name }
    });
  } catch (error) {
    return res.json({
      success: false,
      data: { id: null, name: null }
    });
  }
});

