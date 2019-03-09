import { Router } from "express";
import * as Model from "../Models/Users.Model";
import * as bcrypt from "bcrypt";

export const Users = Router();
// This is the Uri
// By default when Post Request is Made
// Authenticate if this is an actual user
// If not, Perform Redirection
Users.post("/login/", async (req, res, next) => {
  // Find User which satisfies given requirements
  const name = req.body.name;
  const password = req.body.pass;
  const user = await Model.Users.findOne({
    where: {
      Name: name
    }
  });
  // As No Such User Found
  // Login Failed
  if (!user) return res.json({ login: false });

  // Now Compare Passwords for Matching
  // Using bcrypt for Safety
  const match = await bcrypt.compare(password, user.Password);

  if (!match) return res.json({ login: false });

  const authority: string = user.Authority;
  return res.json({ login: true });
});

Users.get("/", async (req, res, next) => {
  const users = await Model.Users.findAll({ attributes: ["id", "Name"] });
  const list: any[] = [];
  users.forEach(user => {
    list.push({ id: user.id, name: user.Name });
  });
  return res.json(list);
});
Users.get("/:<int>id", async (req, res, next) => {
  const id = Number(req.params.id);
  const user = await Model.Users.findOne({ where: { id: id } });
  if (user)
    return res.json({
      success: true,
      data: { id: user!.id, name: user!.Name }
    });
  return res.json({
    success: false,
    data: { id: id, name: null }
  });
});
