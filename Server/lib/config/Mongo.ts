export const DatabaseName = String(
  process.env.MongoDatabaseName || "smartmonitor"
);
export const Host = String(process.env.MongoHost || "localhost");
export const Port = Number(process.env.MongoPort || 27017);
export const UserName = String(
  process.env.MONGO_INITDB_ROOT_USERNAME || "mongo"
);
export const Password = String(
  process.env.MONGO_INITDB_ROOT_PASSWORD || "mongo"
);

export const Bucket = String(process.env.MongoBucketName || "smartmonitor");
export const Bucket_Files = Bucket + ".files";

export function Uri() {
  return "mongodb://" + UserName + ":" + Password + "@" + Host + ":" + Port;
}
