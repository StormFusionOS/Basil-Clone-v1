import { useEffect, useState } from 'react';

const HEALTH_ENDPOINT = 'https://localhost:8443/health';

export const useOfflineHeartbeat = () => {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    const ping = async () => {
      try {
        const response = await fetch(HEALTH_ENDPOINT, {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          }
        });
        if (!response.ok) throw new Error('Healthcheck failed');
        if (mounted) setOffline(false);
      } catch (error) {
        if (mounted) setOffline(true);
      }
    };
    ping();
    const interval = setInterval(ping, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return offline;
};
