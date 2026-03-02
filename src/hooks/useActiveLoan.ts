import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveLoanData {
    id: string;
    amount: number;
    repayment_date: Date;
    days_remaining: number;
    is_overdue: boolean;
    bounce_charges: number;
}

export const useActiveLoan = () => {
    return useQuery({
        queryKey: ["active-loan"],
        queryFn: async (): Promise<ActiveLoanData | null> => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) return null;

            // Find the most recent active LOAN transaction
            // Note: We're assuming 'SUCCESS' status means the loan was disbursed and is still active.
            // If a loan gets repaid, its status should ideally change to 'REPAID' or similar in a real system.
            // For this implementation, we will look for 'SUCCESS'
            const { data: loans, error } = await supabase
                .from("transactions")
                .select("*")
                .eq("user_id", session.user.id)
                .eq("type", "LOAN")
                .eq("status", "SUCCESS") // Active unpaid loan
                .order("created_at", { ascending: false })
                .limit(1);

            if (error) {
                console.error("Error fetching active loan:", error);
                return null;
            }

            if (!loans || loans.length === 0) return null;

            const loan = loans[0];
            const metadata = loan.metadata as any;
            if (!metadata || !metadata.repayment_date) return null;

            const repaymentDate = new Date(metadata.repayment_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            repaymentDate.setHours(0, 0, 0, 0);

            const diffTime = repaymentDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
                id: loan.id,
                amount: Number(loan.amount),
                repayment_date: repaymentDate,
                days_remaining: Math.max(0, diffDays),
                is_overdue: diffDays < 0,
                bounce_charges: Number(metadata.bounce_charges || 50),
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
