import { networkInterfaces } from "os";

function GetIP() {
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

  return "127.0.0.1";
}

export const Server = {
  Port: 8000,
  Name: GetIP()
};
