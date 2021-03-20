import { useLocalStorage } from './useLocalStorage';
import { ConnectionInfoT } from '../Types';

const CONNECTION_INFO = 'CONNECTION_INFO';

export function useConnectionInfo() {
   return useLocalStorage<ConnectionInfoT>(CONNECTION_INFO, {
      serverUrl: '',
      mqttUrl: ''
   });
}
