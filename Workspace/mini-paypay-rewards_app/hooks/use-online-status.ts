import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Returns the device's network connectivity
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    NetInfo.fetch().then((state) => {
      if (mounted) setIsOnline(state.isConnected !== false);
    });
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected !== false);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return isOnline;
}
