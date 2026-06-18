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
          let cleanKey = cert.private_key;
          // Convert any escaped newlines to actual newlines
          cleanKey = cleanKey.replace(/\\n/g, '\n');
          cleanKey = cleanKey.replace(/\\\\n/g, '\n');

          let beginHeader = "-----BEGIN PRIVATE KEY-----";
          let endHeader = "-----END PRIVATE KEY-----";
          if (cleanKey.includes("-----BEGIN RSA PRIVATE KEY-----")) {
            beginHeader = "-----BEGIN RSA PRIVATE KEY-----";
            endHeader = "-----END RSA PRIVATE KEY-----";
          }

          if (cleanKey.includes(beginHeader) && cleanKey.includes(endHeader)) {
            const startIdx = cleanKey.indexOf(beginHeader) + beginHeader.length;
            const endIdx = cleanKey.indexOf(endHeader);
            const body = cleanKey.substring(startIdx, endIdx);

            // Strip any character that is not a valid base64 character (including backslashes, spaces, etc.)
            const cleanedBody = body.replace(/[^A-Za-z0-9+/=]/g, '');

            // Chunk body into standard 64-character lines
            const lines = [];
            for (let i = 0; i < cleanedBody.length; i += 64) {
              lines.push(cleanedBody.substring(i, i + 64));
            }

            cert.private_key = `${beginHeader}\n${lines.join('\n')}\n${endHeader}\n`;
          }
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
