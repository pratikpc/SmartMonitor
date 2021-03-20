import { GetMediaFromMetadata } from '../actions';
import { DataT, MediaT } from '../Types';
import { useLocalStorage } from './useLocalStorage';

const MEDIA_METADATA = 'MEDIA_METADATA';
export default function useMedia() {
   const [media, setMediaMetadata] = useLocalStorage<MediaT[]>(MEDIA_METADATA, [] as MediaT[]);

   const setMedia = (value: string | DataT[]) => {
      const metadataRaw: DataT[] = typeof value === 'string' ? JSON.parse(value) : value;
      // Save state
      setMediaMetadata(GetMediaFromMetadata(metadataRaw));
   };

   const fetchMedia = async () => {
      const metadata = await fetch('/files/list');
      setMedia(await metadata.json());
   };

   return { media, fetchMedia };
}
