import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import passport from 'passport';
import UsersModel from '../Models/Users.Model';
import { RoutesCommon } from './Common.Routes';

export const Users = Router();

Users.get('/login/', (req: Request, res: Response) => {
   if (req.isUnauthenticated()) return res.render('login.html');
   return res.redirect('/files/upload');
});
// This is the Uri
// By default when Post Request is Made
// Authenticate if this is an actual user
// If not, Perform Redirection
Users.post('/login/', passport.authenticate('app', { failureRedirect: '/', successRedirect: '/files/upload' }));

Users.post('/login/json', passport.authenticate('app'), (req: Request, res: Response) => {
   if (req.isAuthenticated()) return res.json({ success: true });
   return res.json({ success: false });
});

// Uri for Logout
Users.all('/logout/', RoutesCommon.IsAuthenticated, (req: Request, res: Response) => {
   req.logout();
   return res.redirect('/');
});

Users.get('/list/', RoutesCommon.IsAdmin, async (_req: Request, res: Response) => {
   return RoutesCommon.NoCaching(res).render('userlist.html');
});

// This is the Uri for Registration of a new user
Users.post('/add/', RoutesCommon.IsAdmin, async (req: Request, res: Response) => {
   try {
      const params = RoutesCommon.GetParameters(req);

      const name = String(params.name);
      if (name == null) return res.json({ success: false, password: null });
      if (name === '') return res.json({ success: false, password: null });

      const countUsers = await UsersModel.count({ where: { Name: name } });

      if (countUsers !== 0) return res.json({ success: false, password: null });

      // Generate Random Pass Key
      const password = randomBytes(10).toString('hex');
      const authority = 'NORMAL';
      const newUser = await UsersModel.create({
         Name: name,
         Password: password,
         Authority: authority
      });

      if (!newUser) return res.json({ success: false, password: null });

      return res.json({ success: true, password: password });
   } catch (error) {
      return res.json({ success: false, password: null });
   }
});

// Display the Change Password Html Page
Users.get('/changepass/', RoutesCommon.IsAuthenticated, (_req: Request, res: Response) => {
   return RoutesCommon.NoCaching(res).render('ChangePass.html');
});

// This is the Uri for Updation of a User's details
// Get Old Password
// And Set Change to New Password
// Logically under REST rules it would be under PUT
// But it's probably not a good idea.
Users.post('/changepass/', RoutesCommon.IsAuthenticated, async (req: Request, res: Response) => {
   try {
      const id = Number(RoutesCommon.GetUser(req).id);

      const params = RoutesCommon.GetParameters(req);
      const oldPass = String(params.old);
      const newPass = String(params.new);

      const user = await UsersModel.findOne({ where: { id: id } });

      // Check if User Exists
      if (!user) return res.json({ success: false });
      // Check if Password Entered is Correct
      const match = await user.ComparePassword(oldPass);
      if (!match) return res.json({ success: false });

      const [count] = await UsersModel.update({ Password: newPass }, { where: { id: id } });

      if (count !== 1) return res.json({ success: false });
      return res.json({ success: true });
   } catch (error) {
      return res.json({ success: false });
   }
});

// Use this to find Details of Current User
Users.get('/current/', async (req: Request, res: Response) => {
   const authority = String(RoutesCommon.GetUser(req).Authority);
   const name = String(RoutesCommon.GetUser(req).Name);
   const id = Number(RoutesCommon.GetUser(req).id);

   return res.json({ id: id, Name: name, Authority: authority });
});

// This is Uri to access List of Non Admin Users
Users.get('/', RoutesCommon.IsAdmin, async (_req: Request, res: Response) => {
   try {
      const users = await UsersModel.findAll({
         attributes: ['id', 'Name'],
         where: { Authority: 'NORMAL' }
      });
      const list: { id: string; name: string }[] = [];
      users.forEach(user => {
         list.push({ id: user.id, name: user.Name });
      });
      return res.json(list);
   } catch (error) {
      return res.json([]);
   }
});
Users.get('/:id', RoutesCommon.IsAdmin, async (req: Request, res: Response) => {
   try {
      const params = RoutesCommon.GetParameters(req);
      const id = Number(params.id);
      const user = await UsersModel.findOne({
         attributes: ['id', 'Name'],
         where: { id: id, Authority: 'NORMAL' }
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

export default Users;
