import { InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { AiService } from './ai.service';

const originalEnv = process.env;

describe('AiService', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        process.env = {
            ...originalEnv,
            GROQ_API_KEY: 'test-groq-key',
            GROQ_MODEL: 'llama-3.3-70b-versatile',
        };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('sends a production chat request to Groq with the PrePe system prompt', async () => {
        const fetchMock = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: '### Recharge help\n\nUse **Mobile Recharge**.' } }],
                usage: { total_tokens: 42 },
            }),
        } as any);

        const service = new AiService();
        const result = await service.chat({
            messages: [{ role: 'user', content: 'How do I recharge?' }],
        });

        expect(result).toEqual({
            success: true,
            message: '### Recharge help\n\nUse **Mobile Recharge**.',
            model: 'llama-3.3-70b-versatile',
            usage: { total_tokens: 42 },
        });

        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.groq.com/openai/v1/chat/completions',
            expect.objectContaining({
                method: 'POST',
                headers: {
                    Authorization: 'Bearer test-groq-key',
                    'Content-Type': 'application/json',
                },
                body: expect.any(String),
            }),
        );

        const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
        expect(body.model).toBe('llama-3.3-70b-versatile');
        expect(body.max_completion_tokens).toBe(900);
        expect(body.messages[0]).toMatchObject({
            role: 'system',
            content: expect.stringContaining('PrePe India Private Limited'),
        });
        expect(body.messages[1]).toEqual({ role: 'user', content: 'How do I recharge?' });
    });

    it('rejects empty or malformed conversations before calling Groq', async () => {
        const fetchMock = jest.spyOn(global, 'fetch' as any);
        const service = new AiService();

        await expect(service.chat({ messages: [] })).rejects.toThrow('At least one message is required');
        await expect(service.chat({ messages: [{ role: 'system' as any, content: 'bad' }] })).rejects.toThrow(
            'Only user and assistant messages are accepted',
        );

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not start when the server-side Groq key is missing', async () => {
        delete process.env.GROQ_API_KEY;
        const service = new AiService();

        await expect(service.chat({ messages: [{ role: 'user', content: 'hello' }] })).rejects.toBeInstanceOf(
            InternalServerErrorException,
        );
    });

    it('maps Groq failures to a user-safe service unavailable error', async () => {
        jest.spyOn(global, 'fetch' as any).mockResolvedValue({
            ok: false,
            status: 429,
            json: async () => ({ error: { message: 'rate limit details' } }),
        } as any);

        const service = new AiService();

        await expect(service.chat({ messages: [{ role: 'user', content: 'hello' }] })).rejects.toBeInstanceOf(
            ServiceUnavailableException,
        );
    });
});
