import ExpressSession, { Store } from 'express-session';
import { Application } from 'express';
import passport from 'passport';
import { Strategy } from 'passport-local';
import * as Config from '../config/session';

import * as Models from '.';

export default async function PassportModelsGenerate(app: Application) {
   // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
   const SequelizeSessionStore = require('connect-session-sequelize')(Store);
   const sessionStore = new SequelizeSessionStore({
      db: Models.SequelizeSql,
      checkExpirationInterval: 24 * 60 * 60 * 1000,
      expiration: 10 * 24 * 60 * 60 * 1000
   });
   app.use(
      ExpressSession({
         cookie: Config.Session.cookie,
         name: Config.Session.name,
         resave: Config.Session.resave,
         saveUninitialized: Config.Session.saveUninitialized,
         secret: Config.Session.secret,
         store: sessionStore
      })
   );

   await sessionStore.sync({ force: false });

   app.use(passport.initialize());
   app.use(passport.session());

   passport.use(
      'app',
      new Strategy(
         // Name of Parameter Fields
         {
            usernameField: 'name',
            passwordField: 'pass',
            passReqToCallback: true
         },
         async (_req, name, password, done) => {
            try {
               if (!name || !password) return done(null, false);
               const user = await Models.Users.findOne({
                  where: {
                     Name: name
                  }
               });
               // As No Such User Found
               // Login Failed
               if (!user) return done(null, false);

               // Now Compare Passwords for Matching
               // Using bcrypt for Safety
               const match = await user.ComparePassword(password);
               if (!match) return done(null, false);
               return done(null, new Models.UserViewModel(user.id, user.Name, user.Authority));
            } catch (error) {
               return done(error, null);
            }
         }
      )
   );

   // New form needed
   // Username (name)
   // Password (pass)
   // Display name (displayName)
   // All requests send withCredentials in Axios
   // Note to frontend
   passport.use(
      'display',
      new Strategy(
         // Name of Parameter Fields
         {
            usernameField: 'name',
            passwordField: 'pass',
            passReqToCallback: true
         },
         async (req, name, password, done) => {
            try {
               const displayName = req.body.displayName;
               if (!name || !password || !displayName) return done(null, false);
               const user = await Models.Users.findOne({
                  where: {
                     Name: name
                  }
               });
               // As No Such User Found
               // Login Failed
               if (!user) return done(null, false);

               // Now Compare Passwords for Matching
               // Using bcrypt for Safety
               const match = await user.ComparePassword(password);
               if (!match) return done(null, false);

               const display = await Models.Displays.findOne({
                  where: {
                     Name: displayName,
                     CreatingUserID: user.id
                  }
               });

               if (display == null) {
                  // Not the creator and hence rejected
                  return done(null, false);
               }

               return done(null, display);
            } catch (error) {
               return done(error, null);
            }
         }
      )
   );

   passport.serializeUser((user: unknown, done) => {
      done(null, user);
   });

   passport.deserializeUser((user: Express.User, done) => done(null, user));
}
