import { randomBytes } from 'crypto';
import { Router } from 'express';
import passport from 'passport';
import { RoutesCommon } from './Common.Routes';
import * as Models from '../Models';

export const Displays = Router();
export default Displays;

// This is a temporary page
// Features needed to be added on /display/list page
Displays.get('/adddisp', RoutesCommon.IsAdmin, (_req, res) => {
   return res.render('adddisp.html');
});
Displays.get('/list', RoutesCommon.IsAuthenticated, (_req, res) => {
   return RoutesCommon.NoCaching(res).render('displist.html');
});

Displays.post('/', RoutesCommon.IsAdmin, async (req, res) => {
   const userId = RoutesCommon.GetUser(req).id;

   const params = RoutesCommon.GetParameters(req);
   const displayName = String(params.displayname).trim().toLowerCase();

   if (!displayName || displayName === '' || !userId)
      return res.json({
         success: false
      });

   const newDisplay = await Models.Displays.create({
      Name: displayName,
      CreatingUserID: userId,
      IdentifierKey: randomBytes(20).toString('hex')
   });

   const success = newDisplay != null;
   return res.json({
      success: success
   });
});

// If Display is Invalid, ValidateActualDisplay returns false
Displays.post('/validate', RoutesCommon.ValidateActualDisplay, (_req, res) => {
   return res.json({ success: true });
});

// Add from Application
Displays.post('/add/', passport.authenticate('app'), async (req, res) => {
   if (req.isUnauthenticated())
      return res.json({
         success: false,
         a: false
      });

   const userId = RoutesCommon.GetUser(req).id;

   const params = RoutesCommon.GetParameters(req);
   const displayName = String(params.displayname).trim().toLowerCase();

   if (!displayName || !userId)
      return res.json({
         success: false,
         a: true
      });

   const display = await Models.Displays.findOne({
      where: {
         CreatingUserID: userId,
         Name: displayName
      }
   });

   if (display == null)
      return res.json({
         success: false,
         c: false
      });

   return res.json({
      success: true,
      data: {
         id: display.id,
         Name: display.Name,
         CreatingUserID: display.CreatingUserID,
         IdentifierKey: display.IdentifierKey
      }
   });
});

Displays.put('/', RoutesCommon.IsAdmin, async (req, res) => {
   const userId = Number(RoutesCommon.GetUser(req).id);

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

Displays.get('/', RoutesCommon.IsAuthenticated, async (_req, res) => {
   const displays = await Models.Displays.findAll({
      attributes: ['id', 'Name'],
      order: [['id', 'ASC']]
   });
   const list: unknown[] = [];
   displays.forEach(display => {
      list.push({ id: display.id, name: display.Name });
   });
   return res.json(list);
});

Displays.get('/:id', RoutesCommon.IsAuthenticated, async (req, res) => {
   const params = RoutesCommon.GetParameters(req);

   if (params == null)
      return res.json({
         success: false,
         data: { id: null, name: null }
      });
   const id = Number(params.id);

   try {
      const display = await Models.Displays.findByPk(id, {
         attributes: ['id', 'Name']
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

Displays.get('/:id/files', RoutesCommon.IsAdmin, async (req, res) => {
   try {
      const params = RoutesCommon.GetParameters(req);

      if (params == null)
         return res.json({
            success: false,
            data: null
         });
      const id = Number(params.id);

      const data: unknown[] = [];
      const files = await Models.Files.findAll({
         where: { DisplayID: id },
         order: [['id', 'ASC']]
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

Displays.delete('/:id', RoutesCommon.IsAdmin, async (req, res) => {
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
