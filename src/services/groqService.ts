/**
 * Groq AI Service - Interface for Shashtika AI
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export const getAIResponse = async (messages: Message[]) => {
    if (!GROQ_KEY) {
        throw new Error("GROQ API Key is missing. Please check your .env file.");
    }

    const systemPrompt: Message = {
        role: 'system',
        content: `You are Shashtika, a helpful, professional, and highly intelligent AI assistant for PrePe India Private Limited.
        
Organization Identity:
- Name: PrePe India Private Limited
- Established: 2026
- CEO: Mr. P. Boopathi Raja M.B.A
- CTO: Mr. P. Jeevasurya B.Tech
- Developer: Mr. P. Jeevasurya B.Tech
- Core Mission: We take care of your Payments & Bill Dues at Just a Click.
- Tagline: Powered by Shashtika Innovations.

Operational Guidelines & Safety:
1. Identify yourself as Shashtika when asked.
2. Assist users with questions about financial services, recharges (mobile, DTH, electricity), BNPL, and platform navigation.
3. If asked about the CEO, CTO, or Developer, provide the names and credentials listed above with professional pride.
4. BE POLITE, CONCISE, AND EFFICIENT.
5. ALWAYS RESPOND IN MARKDOWN FORMAT. Use bolding (*), lists (-), and headings (#) to make your points clear.
6. If a user asks for personal data or sensitive transaction details you cannot access, guide them to use 'Profile > Transactions' or contact support.
7. Do not generate offensive, illegal, or harmful content.
8. Maintain a premium, executive tone at all times.`
    };

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [systemPrompt, ...messages],
                temperature: 0.7,
                max_tokens: 1024,
                top_p: 1,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData?.error?.message || "Failed to fetch AI response");
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error: any) {
        console.error("Groq AI Error:", error);
        throw error;
    }
};
