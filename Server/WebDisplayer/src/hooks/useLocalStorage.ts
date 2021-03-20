// Source
// https://gist.github.com/gragland/2970ae543df237a07be1dbbf810f23fe
import React from 'react';

// Hook
export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<T>] {
   // State to store our value
   // Pass initial state function to useState so logic is only executed once
   const [storedValue, setStoredValue] = React.useState<T>(() => {
      try {
         // Get from local storage by key
         const item = window.localStorage.getItem(key);
         // Parse stored json or if none return initialValue
         return item ? JSON.parse(item) : initialValue;
      } catch (error) {
         // If error also return initialValue
         console.error(error);
         return initialValue;
      }
   });

   // Return a wrapped version of useState's setter function that ...
   // ... persists the new value to localStorage.
   const setValue = (value: T) => {
      // Save state
      setStoredValue(value);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(value));
   };

   return [storedValue, setValue];
}
