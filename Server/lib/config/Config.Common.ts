export function GetIP() {
   return '0.0.0.0';
}

export function IfDockerisedOrSelectDefault(dockerValue: string, defValue: string) {
   return process.env.APP_IS_DOCKERISED ? dockerValue : defValue;
}
