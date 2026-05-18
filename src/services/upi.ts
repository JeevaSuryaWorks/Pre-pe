import { paymentService } from './payment.service';

export interface UPIIntentParams {
    amount: number;
    note?: string;
    name?: string;
}

export const upiService = {
    /**
     * Generates a UPI Intent URL from the backend
     */
    async createPaymentIntent(params: UPIIntentParams) {
        const result = await paymentService.createUpiIntent(params.amount);
        
        if (!result.intent_url) {
            throw new Error("Failed to generate UPI intent from backend");
        }

        return {
            intentUrl: result.intent_url,
            upiRef: result.reference_id,
            transactionId: result.reference_id, // backend handles the real DB ID
            qrData: result.intent_url
        };
    },

    /**
     * Polls the backend for payment status
     */
    async checkPaymentStatus(upiRefId: string) {
        const result = await paymentService.getPaymentStatus(upiRefId);
        
        return { 
            status: result.status, 
            message: result.failure_message || (result.status === 'SUCCESS' ? 'Payment successful' : 'Waiting for confirmation') 
        };
    }
};

