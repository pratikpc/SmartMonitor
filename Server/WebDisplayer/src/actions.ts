import { DataT, MediaT } from './Types';
import Mime from 'mime-types';

export function CurrentTimeHHMM() {
   const now = new Date();
   // HHMM
   return now.getHours() * 1000 + now.getMinutes();
}

export function TimeOutAsync(ShowTime: number) {
   return new Promise<void>(resolve => {
      setTimeout(resolve, ShowTime * 1000 /*ms*/);
   });
}

export function GetMediaFromMetadata(items: DataT[]) {
   if (!Array.isArray(items)) return [];
   const curTime = CurrentTimeHHMM();
   return items
      .map(items => {
         items.Start = Number(items.Start);
         items.End = Number(items.End);
         return items;
      })
      .filter(({ OnDisplay, Start, End }) => {
         if (!OnDisplay) return false;
         if (Start !== 0 && End !== 0) return Start >= curTime && End < curTime;
         // If Start and ENd are both 0
         // This means its time to show
         return true;
      })
      .map(({ file, ShowTime, Path }) => {
         return {
            src: `/files/download/${file}`,
            ShowTime,
            type: Mime.lookup(Path).toString().split('/')[0] === 'image' ? 'img' : 'video'
         } as MediaT;
      });
}
