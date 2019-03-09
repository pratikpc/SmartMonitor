import { Router } from "express";
import * as Model from "../Models/Users.Model";
import { SequelizeSql } from "../Models/Sequelize";

export const Users = Router();
// This is the Uri
// By default when Post Request is Made
// Authenticate if this is an actual user
// If not, Perform Redirection
Users.post("/", async (req, res, next) => {
  // Find User which satisfies given requirements
  const name = req.body.name;
  const password = req.body.pass;
  const user = await Model.Users.findOne({
    where: {
      name: name,
      password: password
    }
  });
  // As No Such User Found
  // Login Failed
  if(!user)
    return res.json({ login: false });

  const authority: string = user.authority;
  return res.json({login: true});
});
