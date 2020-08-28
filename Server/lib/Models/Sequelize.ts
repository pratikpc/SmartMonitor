import { Sequelize } from 'sequelize-typescript';

import Postgres from 'pg';
import * as DB from '../config/db';

import Displays from './Display.Models';
import Users from './Users.Model';
import Files from './Files.Models';

import { Mongo } from './Mongo.Models';

// Create the Connection
export const SequelizeSql = new Sequelize({
   host: DB.Host,
   username: DB.UserName,
   password: DB.Password,
   port: DB.Port,
   dialect: DB.Dialect,
   // operatorsAliases: {'1': '1'},
   //   Set logging to False to disable logging
   logging: true,
   models: [Displays as never, Users as never, Files as never]
});

async function CreateDatabaseIfNotExists(db_name: string) {
   const pool = new Postgres.Pool({
      host: DB.Host,
      user: DB.UserName,
      password: DB.Password,
      port: DB.Port
      // database: "postgres",
   });
   const client = await pool.connect();

   const query = `SELECT COUNT(*) AS cnt FROM pg_database where datname ='${db_name}' AND datistemplate = ${false};`;
   const res = await client.query(query);
   const rowCount = Number(res.rows[0].cnt);
   if (rowCount === 0) {
      // Create the Database Now
      await client.query(`CREATE DATABASE ${db_name}`);
   }
   client.release();
   await pool.end();
}

export async function RunSynchronisation() {
   // First End up Creating the Database
   // In admin Database
   await CreateDatabaseIfNotExists(DB.ProjectName);
   // Authenticate if Entered Information is correct
   await SequelizeSql.authenticate();

   // End up creating the Table
   // If it does not exist
   await Users.sync({ force: false });
   // Insert the Default Value for User if not already present
   await Users.InsertIfNotExists(Users.DefaultUser);

   await Files.sync({ force: false });
   await Displays.sync({ force: false });

   // Mongo Connect to Database
   await Mongo.Connect();
}
