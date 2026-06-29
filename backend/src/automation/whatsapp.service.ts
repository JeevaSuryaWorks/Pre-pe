import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    ConnectionState,
    WASocket
} from '@whiskeysockets/baileys';
import * as path from 'path';
import * as fs from 'fs';
import * as QRCode from 'qrcode';
import pino from 'pino';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(WhatsappService.name);
    private sock: WASocket | null = null;
    private qrCodeBase64: string | null = null;
    private connectionStatus: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' = 'DISCONNECTED';
    private sessionDir = path.join(process.cwd(), 'sessions', 'whatsapp_session');

    constructor(private prisma: PrismaService) {}

    async onModuleInit() {
        // Initialize after 3 seconds to let Nest.js start completely
        setTimeout(() => this.connectToWhatsApp(), 3000);
    }

    onModuleDestroy() {
        if (this.sock) {
            try {
                this.sock.end(undefined);
            } catch (e) {
                this.logger.error('Error closing WhatsApp socket on destroy:', e);
            }
        }
    }

    async connectToWhatsApp() {
        this.logger.log('Initializing WhatsApp connection...');
        this.connectionStatus = 'CONNECTING';

        try {
            // Ensure session directory exists
            if (!fs.existsSync(path.dirname(this.sessionDir))) {
                fs.mkdirSync(path.dirname(this.sessionDir), { recursive: true });
            }

            const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);

            this.sock = makeWASocket({
                auth: state,
                printQRInTerminal: true,
                logger: pino({ level: 'silent' }) as any
            });

            this.sock.ev.on('creds.update', saveCreds);

            this.sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    this.logger.log('New WhatsApp QR code received.');
                    try {
                        this.qrCodeBase64 = await QRCode.toDataURL(qr);
                    } catch (err) {
                        this.logger.error('Failed to generate QR DataURL:', err);
                    }
                }

                if (connection === 'close') {
                    const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                    this.logger.warn(`WhatsApp connection closed (Status: ${statusCode}). Reconnecting: ${shouldReconnect}`);
                    this.connectionStatus = 'DISCONNECTED';
                    this.qrCodeBase64 = null;

                    if (shouldReconnect) {
                        setTimeout(() => this.connectToWhatsApp(), 5000);
                    } else {
                        this.logger.log('WhatsApp logged out. Clearing credentials...');
                        this.clearSession();
                    }
                } else if (connection === 'open') {
                    this.logger.log('WhatsApp connection opened successfully!');
                    this.connectionStatus = 'CONNECTED';
                    this.qrCodeBase64 = null;
                }
            });
        } catch (error) {
            this.logger.error('Error connecting to WhatsApp:', error);
            this.connectionStatus = 'DISCONNECTED';
        }
    }

    private clearSession() {
        try {
            if (fs.existsSync(this.sessionDir)) {
                fs.rmSync(this.sessionDir, { recursive: true, force: true });
            }
        } catch (e) {
            this.logger.error('Failed to clear session directory:', e);
        }
    }

    getStatus() {
        return {
            status: this.connectionStatus,
            hasQr: !!this.qrCodeBase64,
            sessionName: 'Prepe Server',
            phone: this.sock?.user?.id ? this.sock.user.id.split(':')[0] : null
        };
    }

    getQrCode() {
        return {
            qr: this.qrCodeBase64,
            status: this.connectionStatus
        };
    }

    async sendWhatsAppMessage(phone: string, messageContent: string, transactionId?: string) {
        this.logger.log(`Queueing WhatsApp message to ${phone}`);

        // Clean phone number (keep only digits)
        let cleanPhone = phone.replace(/\D/g, '');
        
        // Default to Indian country code (91) if it's 10 digits
        if (cleanPhone.length === 10) {
            cleanPhone = '91' + cleanPhone;
        }

        const jid = `${cleanPhone}@s.whatsapp.net`;

        // Validate if transactionId is a valid UUID format before saving
        let validTxUuid: string | null = null;
        if (transactionId) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(transactionId)) {
                validTxUuid = transactionId;
            }
        }

        // Create log in database
        const log = await this.prisma.automation_logs.create({
            data: {
                transaction_id: validTxUuid,
                customer_phone: phone,
                message_type: 'WHATSAPP',
                message_content: messageContent,
                status: 'PENDING'
            }
        });

        if (this.connectionStatus !== 'CONNECTED' || !this.sock) {
            this.logger.warn(`Cannot send WhatsApp: Status is ${this.connectionStatus}`);
            await this.prisma.automation_logs.update({
                where: { id: log.id },
                data: {
                    status: 'FAILED',
                    error_message: 'WhatsApp not connected'
                }
            });
            return { success: false, error: 'WhatsApp gateway not connected' };
        }

        try {
            await this.sock.sendMessage(jid, { text: messageContent });
            
            this.logger.log(`WhatsApp message sent successfully to ${jid}`);
            
            await this.prisma.automation_logs.update({
                where: { id: log.id },
                data: { status: 'SENT' }
            });

            return { success: true };
        } catch (error: any) {
            this.logger.error(`Failed to send WhatsApp message to ${jid}:`, error);
            
            await this.prisma.automation_logs.update({
                where: { id: log.id },
                data: {
                    status: 'FAILED',
                    error_message: error.message || 'Unknown error'
                }
            });

            return { success: false, error: error.message };
        }
    }
}
