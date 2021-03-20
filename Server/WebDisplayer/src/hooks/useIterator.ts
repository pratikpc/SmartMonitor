import React from 'react';

export default function useIterator(start: number = 0): [number, React.Dispatch<number>, React.Dispatch<number>] {
   const [iterator, setIterator] = React.useState(start);
   const next = (max: number) => {
      setIterator((iterator + 1) % max);
   };
   const reset = (val: number) => {
      setIterator(val);
   };

   return [iterator, next, reset];
}
