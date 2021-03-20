import React from 'react';
import './App.css';
import { MediaT } from './Types';
import Media from './components/Media';
import useIterator from './hooks/useIterator';
import useMedia from './hooks/useMedia';
import useKeyListener from './hooks/useKeyListener';
import MQTTRun from './mqtt';

function App() {
   const [medium, setMedium] = React.useState<MediaT | null>(null);
   const [counter, nextCount, reset] = useIterator();
   const { media, fetchMedia } = useMedia();

   const client = MQTTRun();

   React.useEffect(() => {
      (async () => {
         if (client == null) return;
         const displayIdResponse = await fetch('/display/id', {
            credentials: 'include'
         });
         const displayId = await displayIdResponse.text();
         const topic = `/display/${displayId}`;

         await client.subscribe(topic);

         client.on('message', (topic_, _) => {
            if (topic === topic_) {
               fetchMedia();
            }
         });
      })();
   }, [client]);

   // Listen to Escape
   // Logout on Escape
   useKeyListener('Escape', () => {
      window.location.href = '/user/logout';
   });

   React.useEffect(() => {
      (async () => {
         await fetchMedia();
      })();
   }, []);

   // Execute when mediaMetaData changes
   // On Change, se counter to 0
   React.useEffect(() => {
      // Force change the values
      reset(2);
      // Force change the values
      reset(0);
      // If media is empty, set to null
      if (media.length === 0) setMedium(null);
   }, [media]);

   // Execute on counter change
   React.useEffect(() => {
      if (media == null || media.length === 0 || counter >= media.length) return;
      const medium = media[counter];
      setMedium(medium);

      // Timer is only needed for image
      if (medium.type === 'img') {
         const cleanup = setTimeout(() => {
            nextCount(media.length);
         }, medium.ShowTime * 1000);
         return () => clearTimeout(cleanup);
      }
   }, [counter, media]);

   return (
      <Media
         media={medium}
         onVideoEnd={() => {
            nextCount(media.length);
         }}
      />
   );
}

export default App;
