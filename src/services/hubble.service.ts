import { supabase } from '@/integrations/supabase/client';

export interface HubbleBrand {
    id: string;
    title: string;
    status: string;
    thumbnailUrl: string;
    logoUrl: string;
    brandDescription?: string;
    termsAndConditions?: string[];
    amountRestrictions: {
        minOrderAmount: number;
        maxOrderAmount: number;
        denominations: number[] | null;
    };
    denominationType: 'FIXED' | 'FLEXIBLE';
    cardType: string;
    redemptionType: string;
}

export interface HubbleVoucher {
    id: string;
    cardType: string;
    cardNumber?: string;
    cardPin?: string;
    validTill?: string;
    amount: number;
}

export interface HubbleOrderResponse {
    success: boolean;
    status?: string;
    order?: {
        id: string;
        referenceId: string;
        status: string;
        vouchers: HubbleVoucher[];
        failureReason?: string;
    };
    referenceId?: string;
}

export const getHubbleBrands = async (category?: string): Promise<HubbleBrand[]> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];

        let url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/hubble/brands`;
        if (category) url += `?category=${encodeURIComponent(category)}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch brands');
        
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching Hubble brands:', error);
        return [];
    }
};

export const purchaseHubbleVoucher = async (productId: string, amount: number): Promise<HubbleOrderResponse | null> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/hubble/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId, amount })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(errBody || 'Failed to place order');
        }

        return await response.json();
    } catch (error: any) {
        console.error('Error purchasing voucher:', error);
        throw error;
    }
};
