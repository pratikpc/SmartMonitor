import React from 'react';
import { MediaT } from '../Types';

export default function Media({ media, onVideoEnd }: { media: MediaT | null; onVideoEnd: () => void }) {
   if (media == null) return <img src={'https://www.key2sec.com/img/noinfo.jpg'} alt={'No Images Present'} />;
   if (media.type === 'video') {
      return (
         <video preload="auto" autoPlay muted onEnded={onVideoEnd}>
            <source src={media.src} type="video/webm; codecs=vp9" />
            {/* <source src={media.src} type="video/mp4" /> */}
         </video>
      );
   }
   if (media.type === 'img') {
      return <img src={media.src} alt={'Loading'} />;
   }
   return <></>;
}
