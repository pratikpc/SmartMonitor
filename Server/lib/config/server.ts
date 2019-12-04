import {GetIP} from "./Config.Common";
import * as Path from "path";

export const Server = {
  Port: 8000,
  Name: GetIP(),
  MediaStorage: Path.resolve(String(process.env.INIT_CWD), 'uploads')
};
