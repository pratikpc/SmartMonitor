import Path from "path";

export const Port = 8000;
export const Name = "0.0.0.0";
export const MediaStorage = Path.resolve(
  String(process.env.INIT_CWD),
  "uploads"
);
