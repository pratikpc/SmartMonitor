import { Sequelize } from "sequelize-typescript";
import * as dotenv from "dotenv";

import { Pool } from "pg";

import { Users } from "./Users.Model";

dotenv.config();

// Create the Connection
export const SequelizeSql = new Sequelize({
  host: process.env.DB_HOST!,
  username: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  port: Number(process.env.DB_PORT!),
  database: process.env.DB_PROJ_NAME!,
  dialect: process.env.DB_DIALECT!
});

async function CreateDatabaseIfNotExists(db_name: string) {
  const pool = new Pool({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASS!,
    port: Number(process.env.DB_PORT!),
    database: process.env.DB_ADMIN_NAME!
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
  SequelizeSql.addModels([Users]);
  // End up creating the Table
  // If it does not exist
  Users.sync({ force: false }).then(async () => {
    // Insert the Default Value for User if not already present
    await Users.InsertIfNotExists(Users.DefaultUser);
  });
}
