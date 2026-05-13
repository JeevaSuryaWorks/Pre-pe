import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';

const REMOTE_VERSION_URL = 'https://pre-pe.com/version.json';

export const useAppUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState('');

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // 1. Get current app info
        const info = await App.getInfo();
        const currentVersion = info.version;

        // 2. Fetch remote version
        const response = await fetch(REMOTE_VERSION_URL);
        const data = await response.json();
        
        if (data.version !== currentVersion) {
          setRemoteVersion(data.version);
          setUpdateAvailable(true);
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    // Check on startup
    checkVersion();
  }, []);

  return { updateAvailable, remoteVersion };
};
