export type MediaT = {
   src: string;
   ShowTime: number;
   type: 'video' | 'img' | null;
};

export type DataT = {
   file: number;
   Start: number;
   End: number;
   ShowTime: number;
   OnDisplay: boolean;
   Path: string;
};

export type ConnectionInfoT = { serverUrl: string; mqttUrl: string };
