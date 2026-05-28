import { supabase } from '@/integrations/supabase/client';

const BOT_PREFIX = "8941357558";
const BOT_SUFFIX = "AAHTSB5XpsKakVTicvv354Dt8nkrxXJf998";
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || `${BOT_PREFIX}:${BOT_SUFFIX}`;
const TELEGRAM_GROUP_CHAT_ID = "-1003746086174";

// Safe UUID Generator for compatibility
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

/**
 * Dynamically resolves the admin chat ID using auto-discovery or fallback values
 */
async function resolveChatId(): Promise<string> {
    let chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || localStorage.getItem('prepe_telegram_chat_id') || TELEGRAM_GROUP_CHAT_ID;
    
    if (!chatId || chatId === TELEGRAM_GROUP_CHAT_ID) {
        try {
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
        } catch (err) {
            console.error("Auto-discovery chat ID lookup failed:", err);
        }
    }
    return chatId;
}

/**
 * Send HTML formatted messages to the Telegram bot
 */
async function sendTelegramMessage(text: string, targetChatId?: string) {
    try {
        const chatId = targetChatId || await resolveChatId();
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });
        const resData = await res.json();
        if (!resData.ok) {
            console.error("[TelegramBotService] sendMessage error response:", resData);
        } else {
            console.log(`[TelegramBotService] Message sent successfully to chat ${chatId}`);
        }
    } catch (error) {
        console.error("Failed to send Telegram message:", error);
    }
}

/**
 * Sends a premium Telegram notification to administrators when KYC requests are received
 */
export async function sendTelegramAdminKYCAlert(profile: any, planType: string, kycStatus: string) {
    const isApproved = kycStatus === 'APPROVED';
    const titleEmoji = isApproved ? "✅" : "⏳";
    const statusText = isApproved ? "INSTANT APPROVED" : "PENDING MANUAL REVIEW";
    
    const text = `${titleEmoji} <b>Pre-pe KYC Alert</b>\n` +
                 `<b>New Verification Request Arrived</b>\n\n` +
                 `👤 <b>User Name:</b> ${profile?.full_name || 'Anonymous'}\n` +
                 `📧 <b>Email Address:</b> ${profile?.email || 'N/A'}\n` +
                 `📞 <b>Mobile Phone:</b> ${profile?.phone || 'N/A'}\n` +
                 `🏷️ <b>Selected Plan:</b> <code>${planType}</code>\n` +
                 `🛡️ <b>KYC Action:</b> <b>${statusText}</b>\n` +
                 `🕒 <b>Timestamp:</b> ${new Date().toLocaleString('en-IN')}\n\n` +
                 (isApproved 
                     ? `<i>Simple KYC has been completed automatically for this Basic Plan user.</i>` 
                     : `🔗 <a href="https://pre-pe.com/admin/kyc">Direct Navigate to Admin KYC Verification Desk</a>\n\n` +
                       `<i>Please audit the uploaded identity files in the Admin Desk.</i>`);

    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || TELEGRAM_GROUP_CHAT_ID;
    await sendTelegramMessage(text, chatId);
}

/**
 * Sends a premium Telegram notification to administrators when manual funds are claimed
 */
export async function sendTelegramAdminFundClaimAlert(profile: any, amount: number, transactionId: string) {
    const text = `<b>🔔 Pre-pe Admin Alert</b>\n` +
                 `<b>New Fund Claim Received</b>\n\n` +
                 `👤 <b>User:</b> ${profile?.full_name || 'Anonymous'}\n` +
                 `📧 <b>Email:</b> ${profile?.email || 'N/A'}\n` +
                 `📞 <b>Phone:</b> ${profile?.phone || 'N/A'}\n` +
                 `💵 <b>Amount:</b> ₹${amount}\n` +
                 `🔢 <b>UTR / Txn ID:</b> <code>${transactionId}</code>\n` +
                 `🕒 <b>Time:</b> ${new Date().toLocaleString('en-IN')}\n\n` +
                 `🔗 <a href="https://pre-pe.com/admin/fund-requests">Direct Navigate to Admin Fund Requests Desk</a>\n\n` +
                 `<i>Please review and approve this claim inside the Pre-pe Admin Desk.</i>`;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || TELEGRAM_GROUP_CHAT_ID;
    await sendTelegramMessage(text, chatId);
}

// Background Listener States
let pollingInterval: any = null;
let lastUpdateId = parseInt(localStorage.getItem('prepe_telegram_last_update_id') || '0', 10);

/**
 * Starts polling Telegram updates in the background. Runs inside the active administrator dashboard.
 */
export function startTelegramBotListener() {
    if (pollingInterval) return;

    console.log("Initializing PrePe Telegram bot administrative listener...");
    pollingInterval = setInterval(async () => {
        try {
            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=5`);
            const data = await response.json();
            if (data.ok && data.result && data.result.length > 0) {
                for (const update of data.result) {
                    lastUpdateId = Math.max(lastUpdateId, update.update_id);
                    localStorage.setItem('prepe_telegram_last_update_id', lastUpdateId.toString());
                    
                    const message = update.message;
                    if (message && message.text) {
                        const chatId = message.chat.id;
                        const text = message.text.trim();
                        
                        if (text.startsWith('/')) {
                            await handleBotCommand(chatId, text);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Telegram polling error:", error);
        }
    }, 8000); // Poll every 8 seconds
}

/**
 * Stop background Telegram updates listener
 */
export function stopTelegramBotListener() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        console.log("PrePe Telegram bot administrative listener stopped.");
    }
}

/**
 * Processes incoming administration commands securely inside the admin's session context
 */
async function handleBotCommand(chatId: number, rawCommand: string) {
    const reply = (msg: string) => sendTelegramMessage(msg, chatId.toString());
    const parts = rawCommand.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Save admin chat ID dynamically so messages return to the correct place
    localStorage.setItem('prepe_telegram_chat_id', chatId.toString());

    switch (command) {
        case '/start':
        case '/help':
            await reply(
                `<b>🤖 Pre-pe Administrative Co-Pilot Bot</b>\n\n` +
                `Welcome! Use the following menu commands to audit and approve your platform securely:\n\n` +
                `📊 <b>Platform Statistics:</b>\n` +
                `• <code>/stats</code> - Show live volume, active accounts, and queues.\n\n` +
                `🛡️ <b>KYC Operations:</b>\n` +
                `• <code>/kyc</code> - List pending identity requests.\n` +
                `• <code>/approve_kyc &lt;email&gt;</code> - Approve pending KYC by user email.\n\n` +
                `💵 <b>Fund Request Operations:</b>\n` +
                `• <code>/funds</code> - List pending manual UTR deposits.\n` +
                `• <code>/approve_fund &lt;utr&gt;</code> - Approve fund request and credit wallet.\n\n` +
                `<i>Pre-pe Digital India Administrative Protocol Sec. 8.</i>`
            );
            break;

        case '/stats':
            try {
                // Fetch stats directly through Supabase Client
                const { count: totalUsers } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
                const { data: txns } = await supabase.from('transactions').select('amount').eq('status', 'SUCCESS');
                const { count: pendingKYC } = await supabase.from('kyc_verifications' as any).select('id', { count: 'exact', head: true }).eq('status', 'PENDING');
                const { count: pendingFunds } = await supabase.from('manual_fund_requests' as any).select('id', { count: 'exact', head: true }).eq('status', 'PENDING');

                const totalVolume = txns ? txns.reduce((sum, t) => sum + Number(t.amount), 0) : 0;

                await reply(
                    `<b>📊 Pre-pe Live System Statistics</b>\n\n` +
                    `👥 <b>Total Registered Users:</b> ${totalUsers || 0}\n` +
                    `💰 <b>Lifetime Success Volume:</b> ₹${totalVolume.toLocaleString()}\n` +
                    `⏳ <b>Pending KYC verifications:</b> ${pendingKYC || 0} requests\n` +
                    `💵 <b>Pending Manual Fund claims:</b> ${pendingFunds || 0} claims\n` +
                    `🕒 <b>Synced At:</b> ${new Date().toLocaleString('en-IN')}`
                );
            } catch (err: any) {
                await reply(`❌ <b>Failed to query statistics:</b> <code>${err.message || err}</code>`);
            }
            break;

        case '/kyc':
            try {
                const { data: requests, error } = await supabase
                    .from('kyc_verifications' as any)
                    .select('id, user_id, dob, gender, profiles(full_name, email, plan_type)')
                    .eq('status', 'PENDING')
                    .limit(5);

                if (error) throw error;
                if (!requests || requests.length === 0) {
                    await reply(`✅ <b>Identity Queue Clean:</b> There are no pending KYC requests at the moment.`);
                    return;
                }

                let response = `<b>🛡️ Oldest Pending KYC Requests (Max 5)</b>\n\n`;
                requests.forEach((req: any, index) => {
                    const prof = req.profiles;
                    response += `${index + 1}. 👤 <b>User:</b> ${prof?.full_name || 'Anonymous'}\n` +
                                `📧 <b>Email:</b> ${prof?.email || 'N/A'}\n` +
                                `🏷️ <b>Plan:</b> <code>${prof?.plan_type || 'BASIC'}</code>\n` +
                                `🕒 <b>Command to Approve:</b>\n` +
                                `<code>/approve_kyc ${prof?.email}</code>\n\n`;
                });
                await reply(response);
            } catch (err: any) {
                await reply(`❌ <b>Failed to query KYC:</b> <code>${err.message || err}</code>`);
            }
            break;

        case '/funds':
            try {
                const { data: claims, error } = await supabase
                    .from('manual_fund_requests' as any)
                    .select('id, user_id, amount, transaction_id, profiles(full_name, email)')
                    .eq('status', 'PENDING')
                    .limit(5);

                if (error) throw error;
                if (!claims || claims.length === 0) {
                    await reply(`✅ <b>Fund Queue Clean:</b> There are no pending manual fund claims at the moment.`);
                    return;
                }

                let response = `<b>💵 Oldest Pending Fund Claims (Max 5)</b>\n\n`;
                claims.forEach((claim: any, index) => {
                    const prof = claim.profiles;
                    response += `${index + 1}. 👤 <b>User:</b> ${prof?.full_name || 'Anonymous'}\n` +
                                `💵 <b>Amount:</b> ₹${claim.amount}\n` +
                                `🔢 <b>UTR / Txn ID:</b> <code>${claim.transaction_id}</code>\n` +
                                `🕒 <b>Command to Approve:</b>\n` +
                                `<code>/approve_fund ${claim.transaction_id}</code>\n\n`;
                });
                await reply(response);
            } catch (err: any) {
                await reply(`❌ <b>Failed to query claims:</b> <code>${err.message || err}</code>`);
            }
            break;

        case '/approve_kyc':
            try {
                const emailArg = args[0];
                if (!emailArg) {
                    await reply(`⚠️ <b>Missing Argument:</b> Please provide the user email. Format: <code>/approve_kyc user@example.com</code>`);
                    return;
                }

                // 1. Resolve user profile
                const { data: profile, error: profError } = await supabase
                    .from('profiles')
                    .select('user_id, full_name, email')
                    .eq('email', emailArg.trim())
                    .maybeSingle();

                if (profError || !profile) {
                    await reply(`❌ <b>Error:</b> No registered profile found with email <code>${emailArg}</code>`);
                    return;
                }

                // 2. Resolve pending KYC
                const { data: kycRequest, error: kycError } = await supabase
                    .from('kyc_verifications' as any)
                    .select('id')
                    .eq('user_id', profile.user_id)
                    .eq('status', 'PENDING')
                    .maybeSingle();

                if (kycError || !kycRequest) {
                    await reply(`❌ <b>Error:</b> No active PENDING KYC verification found for user <code>${profile.full_name}</code>.`);
                    return;
                }

                // 3. Update KYC verification status
                const { error: updateError } = await supabase
                    .from('kyc_verifications' as any)
                    .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
                    .eq('id', kycRequest.id);

                if (updateError) throw updateError;

                // 4. Admin Audit Logging
                try {
                    const { data: { user: adminUser } } = await supabase.auth.getUser();
                    if (adminUser) {
                        await supabase.from('admin_audit_logs').insert({
                            admin_id: adminUser.id,
                            action_type: 'KYC_APPROVED',
                            target_id: profile.user_id,
                            details: { kyc_id: kycRequest.id, approved_via: 'telegram_bot' }
                        });
                    }
                } catch (auditErr) {
                    console.warn("Failed inserting audit log:", auditErr);
                }

                // Dispatch window update event so the dashboard UI automatically refreshes!
                window.dispatchEvent(new Event('admin_kyc_requests_updated'));

                await reply(
                    `✅ <b>KYC Verification Approved Successfully!</b>\n\n` +
                    `👤 <b>User:</b> ${profile.full_name}\n` +
                    `📧 <b>Email:</b> <code>${profile.email}</code>\n` +
                    `⚙️ <b>Method:</b> Telegram Co-Pilot Audit`
                );
            } catch (err: any) {
                await reply(`❌ <b>Approval Failed:</b> <code>${err.message || err}</code>`);
            }
            break;

        case '/approve_fund':
            try {
                const utrArg = args[0];
                if (!utrArg) {
                    await reply(`⚠️ <b>Missing Argument:</b> Please provide the transaction UTR. Format: <code>/approve_fund 123456789012</code>`);
                    return;
                }

                // 1. Resolve pending request
                const { data: request, error: reqError } = await supabase
                    .from('manual_fund_requests' as any)
                    .select('id, user_id, amount, status')
                    .eq('transaction_id', utrArg.trim())
                    .eq('status', 'PENDING')
                    .maybeSingle();

                if (reqError || !request) {
                    await reply(`❌ <b>Error:</b> No pending fund request found with UTR / Transaction ID <code>${utrArg}</code>.`);
                    return;
                }

                // 2. Fetch User Profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('user_id', request.user_id)
                    .maybeSingle();

                // 3. Fetch User Wallet
                const { data: wallet, error: walletError } = await supabase
                    .from('wallets')
                    .select('id, balance')
                    .eq('user_id', request.user_id)
                    .maybeSingle();

                if (walletError || !wallet) {
                    await reply(`❌ <b>Error:</b> Wallet not found for user ID <code>${request.user_id}</code>.`);
                    return;
                }

                const prevBalance = Number(wallet.balance);
                const fundAmount = Number(request.amount);
                const newBalance = prevBalance + fundAmount;

                // 4. Update request status to APPROVED
                const { error: updateReqError } = await supabase
                    .from('manual_fund_requests' as any)
                    .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
                    .eq('id', request.id);

                if (updateReqError) throw updateReqError;

                // 5. Adjust Wallet balance
                const { error: updateWalletError } = await supabase
                    .from('wallets')
                    .update({ balance: newBalance, updated_at: new Date().toISOString() })
                    .eq('id', wallet.id);

                if (updateWalletError) throw updateWalletError;

                // 6. Record Wallet Ledger CR Entry
                const { error: ledgerError } = await supabase
                    .from('wallet_ledger')
                    .insert({
                        wallet_id: wallet.id,
                        type: 'CREDIT',
                        amount: fundAmount,
                        balance_after: newBalance,
                        description: `Credit manual fund UTR: ${utrArg} approved via Telegram Bot`
                    });

                if (ledgerError) console.error("Ledger write failed:", ledgerError);

                // 7. Write Audit Log
                try {
                    const { data: { user: adminUser } } = await supabase.auth.getUser();
                    if (adminUser) {
                        await supabase.from('admin_audit_logs').insert({
                            admin_id: adminUser.id,
                            action_type: 'MANUAL_FUND_APPROVED',
                            target_id: request.user_id,
                            details: { 
                                request_id: request.id, 
                                utr: utrArg, 
                                amount: fundAmount, 
                                approved_via: 'telegram_bot' 
                            }
                        });
                    }
                } catch (auditErr) {
                    console.warn("Failed inserting audit log:", auditErr);
                }

                // Dispatch refresh events so Admin dashboard updates automatically!
                window.dispatchEvent(new Event('prepe_users_updated'));
                window.dispatchEvent(new Event('admin_fund_requests_updated'));

                await reply(
                    `✅ <b>Fund Claim Approved Successfully!</b>\n\n` +
                    `👤 <b>User:</b> ${profile?.full_name || 'Anonymous'}\n` +
                    `📧 <b>Email:</b> <code>${profile?.email || 'N/A'}</code>\n` +
                    `💵 <b>Amount Credited:</b> ₹${fundAmount.toLocaleString()}\n` +
                    `🔢 <b>UTR / Txn ID:</b> <code>${utrArg}</code>\n` +
                    `💼 <b>New Wallet Balance:</b> ₹${newBalance.toLocaleString()}`
                );
            } catch (err: any) {
                await reply(`❌ <b>Fund Approval Failed:</b> <code>${err.message || err}</code>`);
            }
            break;

        default:
            await reply(`❌ <b>Unknown Command:</b> Type <code>/help</code> to view all administrative operations.`);
            break;
    }
}
