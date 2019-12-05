import { IfDockerisedOrSelectDefault } from "./Config.Common";

export namespace Mongo {
    export const DatabaseName = String(process.env.MongoDatabaseName);
    export const Host = IfDockerisedOrSelectDefault(process.env.MongoHost, "localhost");
    export const Port = Number(process.env.MongoPort);
    export const UserName = String(process.env.MONGO_INITDB_ROOT_USERNAME);
    export const Password = String(process.env.MONGO_INITDB_ROOT_PASSWORD);

    export const Bucket = String(process.env.MongoBucketName);
    export const Bucket_Files = Mongo.Bucket + ".files";

    export function Uri() {
        return "mongodb://" + Mongo.UserName + ":" + Mongo.Password + "@" + Mongo.Host + ":" + Mongo.Port;
    }
};
