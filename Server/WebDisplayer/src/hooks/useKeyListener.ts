import React from 'react';

export default function useKeyListener(key: string, callback: () => void) {
   return React.useEffect(() => {
      const handleEsc = (event: KeyboardEvent) => {
         if (event.key === key) {
            event.preventDefault();
            callback();
         }
      };
      window.addEventListener('keydown', handleEsc);

      return () => {
         window.removeEventListener('keydown', handleEsc);
      };
   }, []);
}
