import * as Server from './config/server';
import App from './app';

App()
   .then(app => {
      app.listen(Server.Port, Server.Name, () => {
         console.info('Default Login Screen', `${Server.Name}:${Server.Port}`);
      });

      process.on('SIGINT', () => {
         console.info('App Shutting Down');
      });
      return null;
   })
   .catch(err => console.error(err));
