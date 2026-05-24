import { supabase } from "@/integrations/supabase/client";

// Safe standard RFC4122 v4 UUID generator for client-side insertion compatibility
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const TELEGRAM_BOT_TOKEN = "8941357558:AAHTSB5XpsKakVTicvv354Dt8nkrxXJf998";

async function sendTelegramAdminNotification(profile: any, amount: number, transactionId: string) {
    try {
        let chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || localStorage.getItem('prepe_telegram_chat_id');
        
        if (!chatId) {
            console.log("No Telegram Chat ID configured. Attempting auto-discovery...");
            const updatesRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
            const updates = await updatesRes.json();
            if (updates.ok && updates.result && updates.result.length > 0) {
                const lastUpdate = updates.result[updates.result.length - 1];
                if (lastUpdate.message && lastUpdate.message.chat) {
                    chatId = lastUpdate.message.chat.id.toString();
                    localStorage.setItem('prepe_telegram_chat_id', chatId);
                    console.log(`Auto-discovered Telegram Chat ID: ${chatId}`);
                } else if (lastUpdate.channel_post && lastUpdate.channel_post.chat) {
                    chatId = lastUpdate.channel_post.chat.id.toString();
                    localStorage.setItem('prepe_telegram_chat_id', chatId);
                    console.log(`Auto-discovered Telegram Channel Chat ID: ${chatId}`);
                }
            }
        }

        if (!chatId) {
            console.warn("Telegram Admin Notification bypassed: No Chat ID discovered yet. Please start/add @prepe_bot first.");
            return;
        }

        const text = `<b>🔔 Pre-pe Admin Alert</b>\n` +
                     `<b>New Fund Claim Received</b>\n\n` +
                     `👤 <b>User:</b> ${profile?.full_name || 'Anonymous'}\n` +
                     `📧 <b>Email:</b> ${profile?.email || 'N/A'}\n` +
                     `📞 <b>Phone:</b> ${profile?.phone || 'N/A'}\n` +
                     `💵 <b>Amount:</b> ₹${amount}\n` +
                     `🔢 <b>UTR / Txn ID:</b> <code>${transactionId}</code>\n` +
                     `🕒 <b>Time:</b> ${new Date().toLocaleString('en-IN')}\n\n` +
                     `🔗 <a href="http://localhost:8080/admin/fund-requests">Direct Navigate to Admin Fund Requests Desk</a>\n\n` +
                     `<i>Please review and approve this claim inside the Pre-pe Admin Desk.</i>`;

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            })
        });
        console.log("Telegram admin claim notification sent successfully!");
    } catch (err) {
        console.error("Failed to send Telegram admin notification:", err);
    }
}

export const manualFundService = {
    /**
     * Submit a manual fund request for admin approval
     */
    async submitRequest(userId: string, amount: number, transactionId: string) {
        // Fetch user profile for premium notification alerts
        let profile = null;
        try {
            const { data } = await supabase
                .from('profiles')
                .select('full_name, email, phone')
                .eq('user_id', userId)
                .maybeSingle();
            profile = data;
        } catch (e) {
            console.error("Failed to fetch user profile for notification:", e);
        }

        const { data, error } = await (supabase as any)
            .from('manual_fund_requests')
            .insert([
                {
                    id: generateUUID(),
                    user_id: userId,
                    amount: amount,
                    transaction_id: transactionId,
                    status: 'PENDING'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // Dispatch Telegram Notification in background
        sendTelegramAdminNotification(profile, amount, transactionId);

        return data;
    },

    /**
     * Get user's manual requests
     */
    async getUserRequests(userId: string) {
        const { data, error } = await (supabase as any)
            .from('manual_fund_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
};
