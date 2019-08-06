import { Sequelize } from "sequelize-typescript";

import * as Config from "../config/db";

import { Pool } from "pg";

import { Displays } from "./Display.Models";
import { Users } from "./Users.Model";
import { Files } from "./Files.Models";

// Create the Connection
export const SequelizeSql = new Sequelize({
  host: Config.DB.Host,
  username: Config.DB.UserName,
  password: Config.DB.Password,
  port: Config.DB.Port,
  database: Config.DB.AdminName,
  dialect: Config.DB.Dialect,
  operatorsAliases: Config.DB.operatorsAliases,
  // Set logging to False to disable logging
  logging: true
});

async function CreateDatabaseIfNotExists(db_name: string) {
  const pool = new Pool({
    host: Config.DB.Host,
    user: Config.DB.UserName,
    password: Config.DB.Password,
    port: Config.DB.Port,
    database: Config.DB.AdminName
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
  pool.end();
}

export async function RunSynchronisation() {
  // First End up Creating the Database
  // In admin Database
  await CreateDatabaseIfNotExists(process.env.DB_PROJ_NAME!);
  // Authenticate if Entered Information is correct
  await SequelizeSql.authenticate();

  SequelizeSql.addModels([Displays, Users, Files]);
  // End up creating the Table
  // If it does not exist
  Users.sync({ force: false }).then(async () => {
    // Insert the Default Value for User if not already present
    await Users.InsertIfNotExists(Users.DefaultUser);
  });
  await Files.sync({ force: false });
  await Displays.sync({ force: false });
}
