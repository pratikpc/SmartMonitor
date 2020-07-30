import {Dialect as SequelizeDialects} from "sequelize/types";

export const Dialect: SequelizeDialects = String("postgres") as SequelizeDialects;
export const ProjectName = String(
  process.env.DatabaseProjectName || "smartdisplay"
);
export const DatabaseName = String(process.env.DatabaseName || "database");
export const Host = String(process.env.DatabaseHost || "localhost");
export const UserName = String(process.env.DatabaseUserName || "postgres");
export const Port = Number(process.env.DatabasePort || 5432);
export const Password = String(process.env.DatabasePassword || "postgres");
// Removes Warnings Regarding String Operators
// This is indeed a security risk and is introduced by a feature which is
// As of Now, unused by us
// https://github.com/sequelize/sequelize/issues/8417
export const operatorsAliases = false;
