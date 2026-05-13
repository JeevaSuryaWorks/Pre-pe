import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || Capacitor.getPlatform() === 'web') return;

    // 1. Request Permission
    const registerPush = async () => {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('User denied push notification permissions');
        return;
      }

      // 2. Register with FCM
      await PushNotifications.register();
    };

    // 3. Handle Token Generation
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      
      // SAVE TOKEN TO SUPABASE for this user
      const { error } = await supabase
        .from('profiles')
        .update({ fcm_token: token.value } as any)
        .eq('id', user.id);

      if (error) console.error('Error saving FCM token:', error);
    });

    // 4. Handle Registration Error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // 5. Handle Incoming Notification (Foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      toast({
        title: notification.title,
        description: notification.body,
      });
    });

    // 6. Handle Notification Action (User clicked it)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
      // You can navigate to a specific page here
    });

    registerPush();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [user, toast]);
};
