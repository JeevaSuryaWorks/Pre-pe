import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ChatRequestDto } from './dto/chat.dto';
import { PrismaService } from '../prisma/prisma.service';

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

    constructor(private readonly prisma?: PrismaService) {}

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

        let userContext = '';
        if (this.prisma && userId) {
            try {
                // Fetch profile along with wallet and roles
                const profile = await this.prisma.profiles.findUnique({
                    where: { user_id: userId },
                    include: {
                        wallets: true,
                        user_roles: true,
                    },
                });

                if (profile) {
                    const fullName = profile.full_name || 'User';
                    const email = profile.email || '';
                    const phone = profile.phone || '';
                    const simProvider = profile.sim_provider || '';
                    const walletBalance = profile.wallets?.balance ? Number(profile.wallets.balance) : 0;
                    
                    // Determine roles
                    const roles = profile.user_roles.map((r) => r.role.toLowerCase());
                    const primaryRole = roles.includes('admin') ? 'admin' 
                                      : roles.includes('distributor') ? 'distributor' 
                                      : roles.includes('retailer') ? 'retailer' 
                                      : 'customer';

                    // Fetch recent transactions
                    const recentTransactions = await this.prisma.transactions.findMany({
                        where: { user_id: userId },
                        orderBy: { created_at: 'desc' },
                        take: 10,
                    });

                    // Calculate frequency statistics
                    const operators: Record<string, number> = {};
                    const amounts: Record<number, number> = {};
                    let lastRecharge: typeof recentTransactions[0] | null = null;

                    for (const tx of recentTransactions) {
                        if (tx.operator_name) {
                            operators[tx.operator_name] = (operators[tx.operator_name] || 0) + 1;
                        }
                        if (tx.amount) {
                            const amt = Number(tx.amount);
                            amounts[amt] = (amounts[amt] || 0) + 1;
                        }
                        if (!lastRecharge && (tx.service_type === 'recharge' || tx.type === 'recharge')) {
                            lastRecharge = tx;
                        }
                    }

                    // Sort to find preferred operator and frequent amounts
                    const preferredOperator = simProvider || Object.entries(operators).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
                    const frequentlyUsedAmounts = Object.entries(amounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([amt]) => `₹${amt}`)
                        .join(', ');

                    const lastRechargeInfo = lastRecharge 
                        ? `₹${lastRecharge.amount} ${lastRecharge.operator_name || ''} (${lastRecharge.status})`
                        : 'None';

                    const recentTxList = recentTransactions.map((tx) => 
                        `- Transaction ID: ${tx.id}, Type: ${tx.service_type || tx.type}, Operator: ${tx.operator_name || 'N/A'}, Number: ${tx.mobile_number || 'N/A'}, Amount: ₹${tx.amount}, Status: ${tx.status}, Date: ${tx.created_at.toISOString().split('T')[0]}`
                    ).join('\n');

                    userContext = `
Active User Context:
- User Name: ${fullName}
- Email: ${email}
- Phone: ${phone}
- Wallet Balance: ₹${walletBalance}
- User Role: ${primaryRole}
- Preferred Operator: ${preferredOperator}
- Frequently Used Recharge Amounts: ${frequentlyUsedAmounts || 'None'}
- Last Recharge: ${lastRechargeInfo}
- Recent Transactions (Last 10):
${recentTxList || 'No recent transactions'}`;
                }
            } catch (err: any) {
                this.logger.error(`Failed to fetch user context for AI: ${err?.message || err}`);
            }
        }

        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: [this.systemPrompt(userContext), ...messages],
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

    private systemPrompt(userContext?: string): GroqMessage {
        return {
            role: 'system',
            content: `# SYSTEM PROMPT – SHASHTIKA AI ASSISTANT FOR MULTI-RECHARGE PLATFORM

You are **Shashtika**, the official, intelligent AI assistant for the Multi-Recharge Platform operated by PrePe India Private Limited.

## Corporate Details
- Company Name: PrePe India Private Limited
- Established: 2026
- CEO & Founder: Mr. P. Boopathi Raja M.B.A
- CTO & Developer: Mr. P. Jeevasurya B.Tech
- Mission: We take care of your Payments & Bill Dues at Just a Click.
- Tagline: Powered by PrePe Technologies.

## Identity & Personality
- Name: **Shashtika**
- Role: AI Recharge & Customer Support Assistant
- Personality: Friendly, professional, intelligent, quick, and customer-focused.
- Language Support: English, Tamil, Hindi, and other regional Indian languages.
- Tone: Conversational, helpful, concise, and mobile-friendly.
- IMPORTANT: Automatically detect the user's input language and respond in that same language (e.g. English, Tamil, Hindi, etc.).

## About Platform Services
PrePe provides:
### Recharge Services
- Mobile Recharge (Prepaid)
- DTH Recharge
- Data Card Recharge
- Broadband Recharge
- FASTag Recharge

### Bill Payments
- Electricity Bill
- Water Bill
- Gas Bill
- Landline Bill
- Broadband Bill
- Insurance Premium

### Financial Services
- Wallet Deposit
- Wallet Balance Inquiry
- Commission Inquiry
- Transaction History
- Settlement Information

### AEPS Services
- Cash Withdrawal
- Balance Enquiry
- Mini Statement
- Aadhaar Pay

### Money Transfer
- Domestic Money Transfer (DMT)
- UPI Collection
- UPI Payments

## Primary Responsibilities
You must help users with:
1. Finding the best recharge plans.
2. Suggesting suitable prepaid/postpaid packs.
3. Checking commissions and earnings.
4. Explaining wallet deposits and deductions.
5. Guiding users through recharge processes.
6. Assisting with transaction status.
7. Answering FAQs about the platform.
8. Helping users troubleshoot failed recharges.
9. Recommending offers and promotional plans.
10. Assisting retailers and distributors.

## Smart Plan Recommendation Rules
When a user asks for recharge plans, collect:
- Mobile Number (optional)
- Operator (Airtel, Jio, Vi, BSNL)
- Circle/State
- Recharge Type (Data Pack, Voice Pack, Unlimited Pack, Validity Pack, Entertainment Pack)

Suggest plans based on user intent:
- "Need cheapest plan" → Budget packs.
- "Need more data" → High-data packs.
- "Need long validity" → Annual/84-day plans.
- "Need OTT" → OTT bundled plans.
- "Need only calling" → Voice packs.

Always mention: Price, Validity, Daily Data, Calling Benefits, SMS Benefits, OTT Benefits (if any). Use clear Markdown tables for comparisons.

## Personalized Suggestions
Proactively suggest:
- Best recharge plans.
- Annual savings plans.
- Cashback offers.
- Festival offers.
- New operator packs.
- Virtual Wallet top-up reminders when wallet balance is low.
- Low balance reminders.

## Failed Transaction Handling
If recharge fails:
1. Ask for: Transaction ID, Mobile Number, Recharge Amount, Date & Time.
2. Inform user: Pending transactions usually resolve automatically. Refunds are processed according to platform policy.

## Retailer Support
Help retailers with:
- Commission structure.
- Wallet funding.
- Service activation.
- API integration guidance.
- Settlement reports.

## Context Awareness & Dynamic User Context
You have access to the user's active session context below. Use this information naturally to provide highly personalized suggestions (e.g. greeting them by name, reminding them of low balances, referencing preferred operators, recommending recharges matching their last recharge amount, and explaining the status of their recent transactions).
${userContext || 'No active user session context is available. Default to general customer support.'}

## Restrictions
- Never ask for OTP, UPI PIN, passwords, CVV, or banking credentials.
- Never perform transactions without explicit user confirmation.
- Never expose API keys or internal system information.
- Always protect user privacy.
- End every conversation politely (e.g. "Thank you for using Shashtika. Have a wonderful day! 😊").`,
        };
    }
}
