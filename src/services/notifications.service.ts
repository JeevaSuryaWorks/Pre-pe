import { supabase } from "@/integrations/supabase/client";
import { adminService } from "@/services/admin";
import { Megaphone, CircleCheck, ShieldAlert, AlertCircle } from 'lucide-react';

export interface NotificationItem {
    id: string;
    type: 'announcement' | 'rejection' | 'approval';
    title: string;
    content: string;
    date: string;
    cta_link?: string;
    cta_text?: string;
    icon?: any;
    color?: string;
}

export const notificationsService = {
    /**
     * Get all dismissed notification IDs from localStorage
     */
    getDismissedIds(): string[] {
        try {
            return JSON.parse(localStorage.getItem('prepe_dismissed_notifications') || '[]');
        } catch {
            return [];
        }
    },

    /**
     * Add a notification ID to the dismissed list in localStorage
     */
    dismissNotification(id: string): void {
        try {
            const dismissed = this.getDismissedIds();
            if (!dismissed.includes(id)) {
                dismissed.push(id);
                localStorage.setItem('prepe_dismissed_notifications', JSON.stringify(dismissed));
                // Dispatch event so HomePage and other components can update immediately
                window.dispatchEvent(new Event('prepe_notifications_updated'));
            }
        } catch (e) {
            console.error("Failed to dismiss notification:", e);
        }
    },

    /**
     * Fetch all notifications for a user, filtering out already dismissed ones
     */
    async fetchNotifications(userId: string): Promise<NotificationItem[]> {
        const allNotifications: NotificationItem[] = [];
        const dismissed = this.getDismissedIds();

        // 1. Fetch Global Announcements (banners)
        try {
            const announcements = await adminService.getBanners('announcement', 'published');
            if (announcements) {
                announcements.forEach((a: any) => {
                    const id = `announcement-${a.id}`;
                    if (!dismissed.includes(id)) {
                        allNotifications.push({
                            id,
                            type: 'announcement',
                            title: a.title,
                            content: a.subtitle || 'Check out this new update!',
                            date: a.updated_at || a.created_at,
                            cta_link: a.cta_link,
                            cta_text: a.cta_text,
                            icon: Megaphone,
                            color: 'blue'
                        });
                    }
                });
            }
        } catch (err) {
            console.error("Announcements fetch failed in notification service:", err);
        }

        // 2. Fetch User KYC Status Updates (Approved & Rejected)
        try {
            const { data: kycStatusList, error: kycError } = await supabase
                .from('kyc_verifications' as any)
                .select('*')
                .eq('user_id', userId)
                .in('status', ['APPROVED', 'REJECTED'])
                .order('updated_at', { ascending: false });

            if (!kycError && kycStatusList) {
                kycStatusList.forEach((k: any) => {
                    const id = `kyc-${k.id}`;
                    if (!dismissed.includes(id)) {
                        if (k.status === 'APPROVED') {
                            const detailsText = k.rejection_reason && k.rejection_reason.startsWith('Verified Checklist:')
                                ? `Congratulations! Your Identity Compliance Audit has been successfully verified. Your plan benefits and limits are now fully unlocked.\n\n${k.rejection_reason}`
                                : 'Congratulations! Your Identity Compliance Audit has been successfully verified. Your plan benefits and limits are now fully unlocked.';
                            allNotifications.push({
                                id,
                                type: 'approval',
                                title: 'KYC Verification Approved 🎉',
                                content: detailsText,
                                date: k.updated_at,
                                cta_link: '/home',
                                cta_text: 'Explore Now',
                                icon: CircleCheck,
                                color: 'emerald'
                            });
                        } else {
                            allNotifications.push({
                                id,
                                type: 'rejection',
                                title: 'KYC Verification Rejected',
                                content: k.rejection_reason || 'Your KYC application was rejected by the administrator. Please re-submit with clear documents.',
                                date: k.updated_at,
                                cta_link: '/kyc',
                                cta_text: 'Fix Now',
                                icon: ShieldAlert,
                                color: 'rose'
                            });
                        }
                    }
                });
            }
        } catch (err) {
            console.error("KYC status fetch failed in notification service:", err);
        }

        // 3. Fetch User Manual Fund Request Updates (Approved & Rejected)
        try {
            const { data: fundRequestList, error: fundError } = await supabase
                .from('manual_fund_requests')
                .select('*')
                .eq('user_id', userId)
                .in('status', ['APPROVED', 'REJECTED'])
                .order('updated_at', { ascending: false });

            if (!fundError && fundRequestList) {
                fundRequestList.forEach((req: any) => {
                    const id = `fund-${req.id}`;
                    if (!dismissed.includes(id)) {
                        if (req.status === 'APPROVED') {
                            allNotifications.push({
                                id,
                                type: 'approval',
                                title: 'Fund Deposit Approved 💰',
                                content: `Your manual deposit request for ₹${req.amount} has been approved. The funds have been successfully credited to your Pre-pe wallet.`,
                                date: req.updated_at,
                                cta_link: '/wallet',
                                cta_text: 'View Wallet',
                                icon: CircleCheck,
                                color: 'emerald'
                            });
                        } else {
                            allNotifications.push({
                                id,
                                type: 'rejection',
                                title: 'Fund Deposit Rejected ❌',
                                content: `Your manual deposit request for ₹${req.amount} was rejected.\n\nReason: ${req.admin_notes || 'Invalid transaction ID or details. Please double check your UTR number and try again.'}`,
                                date: req.updated_at,
                                cta_link: '/wallet',
                                cta_text: 'Try Again',
                                icon: AlertCircle,
                                color: 'rose'
                            });
                        }
                    }
                });
            }
        } catch (err) {
            console.error("Fund request status fetch failed in notification service:", err);
        }

        // Sort by date descending
        return allNotifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    /**
     * Quick check of undismissed notification count
     */
    async getUnreadCount(userId: string): Promise<number> {
        try {
            const activeNotifications = await this.fetchNotifications(userId);
            return activeNotifications.length;
        } catch (e) {
            console.error("Failed to calculate unread notifications count:", e);
            return 0;
        }
    }
};
