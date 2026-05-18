import { supabase } from '@/integrations/supabase/client';
import { API_BASE_URL } from '@/utils/api-config';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export const getAIResponse = async (messages: Message[]) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            throw new Error("Please log in again to use Shashtika AI.");
        }

        const response = await fetch(`${API_BASE_URL}/ai/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: messages
                    .filter((message) => message.role === 'user' || message.role === 'assistant')
                    .slice(-14),
            }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data?.message || "Shashtika is unavailable. Please try again.");
        }

        if (!data?.message) {
            throw new Error("Shashtika returned an empty response. Please try again.");
        }

        return data.message;
    } catch (error: any) {
        console.error("Shashtika AI Error:", error);
        throw error;
    }
};
