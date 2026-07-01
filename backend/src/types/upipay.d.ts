declare module 'upipay' {
    export interface UPIPayConfig {
        provider?: 'phonepe' | 'paytm' | string;
        environment?: 'sandbox' | 'production' | string;
        credentials?: Record<string, string>;
    }

    export interface CreatePaymentInput {
        amount: number;
        orderId: string;
        customerPhone: string;
        customerName: string;
        callbackUrl: string;
        redirectUrl: string;
    }

    export interface CreatePaymentResult {
        success: boolean;
        paymentUrl?: string;
        [key: string]: unknown;
    }

    export interface WebhookEvent {
        verified: boolean;
        status: 'SUCCESS' | 'FAILED' | 'PENDING' | string;
        orderId: string;
        [key: string]: unknown;
    }

    export class UPIPay {
        constructor(config: UPIPayConfig);

        createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;

        verifyWebhook(rawBody: Buffer | string, signature: string): WebhookEvent;
    }
}
