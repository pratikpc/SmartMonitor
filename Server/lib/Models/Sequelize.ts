import { Sequelize } from "sequelize-typescript";

import * as Config from "../config/db";

import { Pool } from "pg";

import { Displays } from "./Display.Models";
import { Users } from "./Users.Model";
import { Files } from "./Files.Models";

import {Mongo} from "./Mongo.Models";

// Create the Connection
export const SequelizeSql = new Sequelize({
  host: Config.DB.Host,
  username: Config.DB.UserName,
  password: Config.DB.Password,
  port: Config.DB.Port,
  database: Config.DB.ProjectName,
  dialect: Config.DB.Dialect,
  operatorsAliases: Config.DB.operatorsAliases,
  // Set logging to False to disable logging
  logging: console.log
});

async function CreateDatabaseIfNotExists(db_name: string) {
  const pool = new Pool({
    host: Config.DB.Host,
    user: Config.DB.UserName,
    password: Config.DB.Password,
    port: Config.DB.Port,
    database: Config.DB.DatabaseName
  });
  const client = await pool.connect();

  const query: string =
    "SELECT COUNT(*) AS cnt FROM pg_database where datname" +
    "='" +
    db_name +
    "'" +
    " AND datistemplate = false;";
  const res = await client.query(query);
  const rowCount = Number(res.rows[0].cnt);
  if (rowCount === 0) {
    // Create the Database Now
    await client.query("CREATE DATABASE " + db_name);
  }
  client.release();
  await pool.end();
}

export async function Setup() {
  // First End up Creating the Database
  // In admin Database
  await CreateDatabaseIfNotExists(Config.DB.ProjectName);
  // Authenticate if Entered Information is correct
  await SequelizeSql.authenticate();

  SequelizeSql.addModels([Displays, Users, Files]);
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
