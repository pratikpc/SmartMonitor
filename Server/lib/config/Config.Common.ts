import { networkInterfaces } from "os";

export function GetIP() {
  const interfaces = networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];

    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (
        alias.family === "IPv4" &&
        alias.address !== "127.0.0.1" &&
        !alias.internal
      )
        return alias.address;
    }
  }

  return "localhost";
}

export function IfDockerisedOrSelectDefault(dockerValue: any, defValue: string) {
  return process.env.APP_IS_DOCKERISED ? String(dockerValue) : defValue;
}
