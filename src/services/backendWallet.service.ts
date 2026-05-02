import { supabase } from "@/integrations/supabase/client";

const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    if (!url.endsWith("/api")) {
        url = url.endsWith("/") ? url + "api" : url + "/api";
    }
    return url;
};

const API_BASE_URL = getBaseUrl();

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
     * Create a UPI Intent for Wallet Top-up (Legacy/Dummy)
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

        return await response.json();
    },

    /**
     * Create Razorpay Order
     */
    async createRazorpayOrder(amount: number) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/wallet/create-order`, {
            method: "POST",
            headers,
            body: JSON.stringify({ amount }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to create Razorpay order");
        }

        return await response.json();
    },

    /**
     * Verify Razorpay Payment
     */
    async verifyRazorpayPayment(paymentData: any) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/wallet/verify-payment`, {
            method: "POST",
            headers,
            body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Payment verification failed");
        }

        return await response.json();
    },

    /**
     * Verify UPI Payment and Credit Wallet (Legacy/Dummy)
     */
    async verifyUpi(upiRef: string) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/wallet/upi/verify`, {
            method: "POST",
            headers,
            body: JSON.stringify({ upiRef }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "UPI verification failed");
        }

        return await response.json();
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
