import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ChatRequestDto } from './dto/chat.dto';

type GroqRole = 'system' | 'user' | 'assistant';

interface GroqMessage {
    role: GroqRole;
    content: string;
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const MAX_HISTORY_MESSAGES = 14;
const REQUEST_TIMEOUT_MS = 30000;

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);

    async chat(body: ChatRequestDto, userId?: string) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            this.logger.error('GROQ_API_KEY is not configured on the backend');
            throw new InternalServerErrorException('AI service is not configured');
        }

        const messages = this.prepareMessages(body.messages);
        const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: [this.systemPrompt(), ...messages],
                    temperature: 0.45,
                    top_p: 0.9,
                    max_completion_tokens: 900,
                    user: userId,
                }),
                signal: controller.signal,
            });

            const data: any = await response.json().catch(() => ({}));

            if (!response.ok) {
                this.logger.warn(`Groq request failed: ${response.status} ${data?.error?.message || 'Unknown error'}`);
                throw new ServiceUnavailableException('Shashtika is busy right now. Please try again in a moment.');
            }

            const message = data?.choices?.[0]?.message?.content?.trim();
            if (!message) {
                this.logger.warn('Groq returned an empty AI response');
                throw new ServiceUnavailableException('Shashtika could not prepare a response. Please try again.');
            }

            return {
                success: true,
                message,
                model,
                usage: data.usage || null,
            };
        } catch (error: any) {
            if (
                error instanceof BadRequestException ||
                error instanceof InternalServerErrorException ||
                error instanceof ServiceUnavailableException
            ) {
                throw error;
            }

            if (error?.name === 'AbortError') {
                this.logger.warn('Groq request timed out');
                throw new ServiceUnavailableException('Shashtika took too long to respond. Please try again.');
            }

            this.logger.error(`Groq AI error: ${error?.message || error}`);
            throw new ServiceUnavailableException('Shashtika is unavailable right now. Please try again shortly.');
        } finally {
            clearTimeout(timeout);
        }
    }

    private prepareMessages(messages: ChatRequestDto['messages']): GroqMessage[] {
        if (!Array.isArray(messages) || messages.length === 0) {
            throw new BadRequestException('At least one message is required');
        }

        const cleaned = messages
            .map((message) => ({
                role: message.role,
                content: typeof message.content === 'string' ? message.content.trim() : '',
            }))
            .filter((message) => message.content.length > 0);

        if (cleaned.length === 0) {
            throw new BadRequestException('At least one message is required');
        }

        const invalid = cleaned.find((message) => message.role !== 'user' && message.role !== 'assistant');
        if (invalid) {
            throw new BadRequestException('Only user and assistant messages are accepted');
        }

        return cleaned.slice(-MAX_HISTORY_MESSAGES);
    }

    private systemPrompt(): GroqMessage {
        return {
            role: 'system',
            content: `You are Shashtika, the official AI assistant for PrePe India Private Limited.

Company facts:
- Name: PrePe India Private Limited
- Established: 2026
- CEO: Mr. P. Boopathi Raja M.B.A
- CTO and Developer: Mr. P. Jeevasurya B.Tech
- Mission: We take care of your Payments & Bill Dues at Just a Click.
- Tagline: Powered by PrePe Technologies.

You help logged-in PrePe users with mobile recharge, DTH, electricity bills, wallet, BNPL, KYC, rewards, safety, transactions, and app navigation.

Production behavior:
- Be concise, warm, professional, and accurate.
- Use markdown for structure: short headings, bullets, bold key terms, and tables for comparisons.
- Never claim you can see private wallet balances, KYC documents, OTPs, cards, bank data, or transaction records unless that data is explicitly provided in the chat.
- For private account questions, guide users to the relevant PrePe screen such as Profile, Wallet, Transactions, KYC, or Contact Support.
- Do not request OTPs, passwords, full card numbers, or sensitive identity documents in chat.
- If a topic is outside PrePe payments and app support, answer briefly when safe and bring the user back to PrePe help.`,
        };
    }
}
