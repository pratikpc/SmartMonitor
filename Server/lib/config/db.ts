import {IfDockerisedOrSelectDefault} from "./Config.Common";

export const DB = {
  Dialect: String(process.env.DatabaseDialect),
  ProjectName: String(process.env.DatabaseProjectName),
  DatabaseName: String(process.env.DatabaseName),
  Host: IfDockerisedOrSelectDefault(process.env.DatabaseHost, "localhost"),
  UserName: String(process.env.DatabaseUserName),
  Port: Number(process.env.DatabasePort),
  Password: String(process.env.DatabasePassword),
  // Removes Warnings Regarding String Operators
  // This is indeed a security risk and is introduced by a feature which is
  // As of Now, unused by us
  // https://github.com/sequelize/sequelize/issues/8417
  operatorsAliases: false
};
