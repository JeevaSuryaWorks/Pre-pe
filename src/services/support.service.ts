import { supabase } from "@/integrations/supabase/client";
import { API_BASE_URL } from '@/utils/api-config';

async function getAuthHeaders() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
    };
}

export const supportService = {
    /**
     * User: Submit a new support complaint ticket
     */
    async createTicket(transactionId: string, reason: string, details?: string) {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
            throw new Error("Unauthorized: User session not found.");
        }

        const { data, error } = await supabase
            .from('support_tickets')
            .insert({
                user_id: userId,
                transaction_id: transactionId,
                reason,
                details,
                status: 'PENDING'
            })
            .select()
            .single();

        if (error) {
            throw new Error(error.message || "Failed to submit support ticket");
        }

        return data;
    },

    /**
     * User: Fetch own ticket list
     */
    async getUserTickets() {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
            throw new Error("Unauthorized: User session not found.");
        }

        const { data, error } = await supabase
            .from('support_tickets')
            .select(`
                *,
                transaction:transactions(*)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(error.message || "Failed to fetch tickets");
        }

        return data;
    },

    /**
     * Admin: Fetch all tickets
     */
    async getAdminTickets() {
        const { data, error } = await supabase
            .from('support_tickets')
            .select(`
                *,
                transaction:transactions(*),
                profile:profiles(full_name, phone, email)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(error.message || "Failed to fetch admin tickets");
        }

        return data;
    },

    /**
     * Admin: Update ticket status and write admin notes
     */
    async resolveTicket(ticketId: string, status: string, adminNotes?: string) {
        const { data, error } = await supabase
            .from('support_tickets')
            .update({
                status,
                admin_notes: adminNotes,
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId)
            .select()
            .single();

        if (error) {
            throw new Error(error.message || "Failed to update support ticket");
        }

        return data;
    },

    /**
     * Admin: Trigger real-time re-processing of the failed transaction
     */
    async reprocessRecharge(ticketId: string) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/support/admin/reprocess/${ticketId}`, {
            method: "POST",
            headers,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Reprocessing failed");
        }

        return await response.json();
    }
};

