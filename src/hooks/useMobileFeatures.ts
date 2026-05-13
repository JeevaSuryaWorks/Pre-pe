import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Network } from '@capacitor/network';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useToast } from './use-toast';

export const useMobileFeatures = () => {
  const { toast } = useToast();

  useEffect(() => {
    // 1. Initialize Status Bar
    const initStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#171717' }); // Dark slate
      } catch (e) {
        console.warn('Status bar not available');
      }
    };

    // 2. Network Listener
    const initNetwork = async () => {
      Network.addListener('networkStatusChange', status => {
        if (!status.connected) {
          toast({
            title: "No Internet",
            description: "Please check your connection.",
            variant: "destructive",
          });
        }
      });
    };

    // 3. Back Button Handling for Android
    const initBackButton = () => {
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });
    };

    initStatusBar();
    initNetwork();
    initBackButton();

    return () => {
      Network.removeAllListeners();
      App.removeAllListeners();
    };
  }, [toast]);

  const triggerVibration = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {}
  };

  return { triggerVibration };
};
