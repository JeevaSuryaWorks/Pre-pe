import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationService implements OnModuleInit {
  private initialized = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const serviceAccount = this.configService.get('FIREBASE_SERVICE_ACCOUNT');
    
    if (serviceAccount) {
      try {
        const cert = JSON.parse(serviceAccount);
        if (cert && cert.private_key) {
          // Robustly clean private key from double-escaped newlines, spaces, and carriage returns
          let cleanKey = cert.private_key;
          cleanKey = cleanKey.replace(/\\n/g, '\n');
          cleanKey = cleanKey.replace(/\\\\n/g, '\n');
          
          // Split by newline, trim whitespace/carriage returns, and join back
          cert.private_key = cleanKey
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
        }
        admin.initializeApp({
          credential: admin.credential.cert(cert),
        });
        this.initialized = true;
        console.log('Firebase Admin SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
      }
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT not found in environment. Push notifications disabled.');
    }
  }

  async sendPushNotification(fcmToken: string, title: string, body: string, data?: any) {
    if (!this.initialized || !fcmToken) return;

    const message: admin.messaging.Message = {
      notification: { title, body },
      token: fcmToken,
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'OPEN_APP',
        },
      },
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent push notification:', response);
      return response;
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
}
