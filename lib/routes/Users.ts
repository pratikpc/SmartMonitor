import { Router } from "express";
import * as Model from "../Models/Users.Model";
import * as bcrypt from 'bcrypt';

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
      name: name
    }
  });
  // As No Such User Found
  // Login Failed
  if(!user)
    return res.json({ login: false });

  // Now Compare Passwords for Matching
  // Using bcrypt for Safety
  const match = await bcrypt.compare(password,user.password);

  if(!match)
    return res.json({ login: false });

  const authority: string = user.authority;
  return res.json({login: true});
});
