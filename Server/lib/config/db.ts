export const DB = {
  Dialect: "postgres",
  ProjectName: "smartdisplay",
  AdminName: "postgres",
  Host: "localhost",
  UserName: "postgres",
  Port: 5432,
  Password: "postgres",
  // Removes Warnings Regarding String Operators
  // This is indeed a security risk and is introduced by a feature which is
  // As of Now, unused by us
  // https://github.com/sequelize/sequelize/issues/8417
  operatorsAliases: false
};
