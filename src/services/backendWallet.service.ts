import { supabase } from "@/integrations/supabase/client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function getAuthHeaders() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
    };
}

export const backendWalletService = {
    /**
     * Create a UPI Intent for Wallet Top-up
     */
    async createUpiIntent(amount: number) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/wallet/upi/create-intent`, {
            method: "POST",
            headers,
            body: JSON.stringify({ amount }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to create UPI intent");
        }

        const data = await response.json();
        return {
            ...data,
            intentUrl: data.intentUrl || data.intent_url,
            upiRef: data.upiRef || data.reference_id,
        };
    },

    /**
     * Verify UPI Payment and Credit Wallet
     */
    async verifyUpi(upiRef: string) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/wallet/upi/verify`, {
            method: "POST",
            headers,
            body: JSON.stringify({ upiRef, reference_id: upiRef }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "UPI verification failed");
        }

        const data = await response.json();
        return {
            ...data,
            status: data.status,
        };
    },

    /**
     * Subscribe to a plan using Razorpay
     */
    async subscribePlan(paymentData: any) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/wallet/subscribe-plan`, {
            method: "POST",
            headers,
            body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Subscription failed");
        }

        return await response.json();
    }
};
