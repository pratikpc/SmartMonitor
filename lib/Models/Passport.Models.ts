import ExpressSession, { Store } from "express-session";
// import * as cookieParser from "cookie-parser";
import * as Express from "express";
import passport from "passport";
import * as Config from "../config/session";
import { Strategy } from "passport-local";

import * as Model from "../Models/Models";

export function PassportModelsGenerate(app: Express.Application) {
  const SequelizeSessionStore = require('connect-session-sequelize')(Store);
      const sessionStore = new SequelizeSessionStore({
      db: Model.SequelizeSql,
      checkExpirationInterval: 15 * 60 * 1000,
      expiration: 24 * 60 * 60 * 60 * 1000
    });
  app.use(
    ExpressSession({
      cookie: Config.Session.cookie,
      name: Config.Session.name,
      resave: Config.Session.resave,
      saveUninitialized: Config.Session.saveUninitialized,
      secret: Config.Session.secret,
      // store: new FileStore()
        store: sessionStore
    })
  );

  sessionStore.sync();

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    "app",
    new Strategy(
      // Name of Parameter Fields
      {
        usernameField: "name",
        passwordField: "pass",
        passReqToCallback: true
      },
      async (req, name, password, done) => {
        try {
          if (!name || !password) return done(null, null);
          const user = await Model.Users.findOne({
            where: {
              Name: name
            }
          });
          // As No Such User Found
          // Login Failed
          if (!user) return done(null, null);

          // Now Compare Passwords for Matching
          // Using bcrypt for Safety
          const match = await user.ComparePassword(password);

          if (!match) return done(null, null);

          const authority: string = user.Authority;
          return done(
            null,
            new Model.UserViewModel(user.id, user.Name, user.Authority)
          );
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user: Model.UserViewModel, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await Model.Users.findById(id);
      if (user == null) return done(null, undefined);
      else
        return done(
          null,
          new Model.UserViewModel(user.id, user.Name, user.Authority)
        );
    } catch (error) {
      done(error, undefined);
    }
  });
}
