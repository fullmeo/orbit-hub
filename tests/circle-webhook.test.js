// Mock Anthropic SDK BEFORE importing handler
const mockAnthropicInstance = {
  messages: {
    create: jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'Merci pour ton généreux tip en USDC! 🌟' }],
    }),
  },
};

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => mockAnthropicInstance);
});

// NOW import handler
const handler = require('../netlify/functions/circle-webhook');

describe('Circle Webhook Handler', () => {
  const mockEvent = (overrides = {}) => ({
    httpMethod: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-circle-signature': 'test-signature',
      ...(overrides.headers || {}),
    },
    body: JSON.stringify({
      notificationType: 'payment.confirmed',
      data: {
        id: 'pi_123',
        amount: { amount: '5', currency: 'USD' },
        metadata: { fanName: 'TestFan' },
      },
    }),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear in-memory store
    handler.thankYouMessages.clear();
  });

  describe('OPTIONS', () => {
    it('should handle OPTIONS requests', async () => {
      const event = mockEvent({ httpMethod: 'OPTIONS' });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
    });
  });

  describe('Method validation', () => {
    it('should reject non-POST methods', async () => {
      const event = mockEvent({ httpMethod: 'GET' });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(405);
    });
  });

  describe('Signature verification', () => {
    it('should accept webhooks when no secret configured', async () => {
      const originalSecret = process.env.CIRCLE_WEBHOOK_SECRET;
      delete process.env.CIRCLE_WEBHOOK_SECRET;
      const event = mockEvent();
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      process.env.CIRCLE_WEBHOOK_SECRET = originalSecret;
    });

    it('should accept valid signature', async () => {
      process.env.CIRCLE_WEBHOOK_SECRET = 'test-secret';
      const event = mockEvent();
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      delete process.env.CIRCLE_WEBHOOK_SECRET;
    });
  });

  describe('JSON parsing', () => {
    it('should reject invalid JSON', async () => {
      const event = mockEvent({ body: 'invalid json' });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
    });
  });

  describe('Payment confirmation', () => {
    it('should process confirmed payment and generate thank you message', async () => {
      const event = mockEvent();
      const result = await handler.handler(event);

      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.success).toBe(true);
      expect(data.paymentId).toBe('pi_123');
      expect(data.messageGenerated).toBe(true);

      // Verify message stored
      expect(handler.thankYouMessages.has('pi_123')).toBe(true);
      const stored = handler.thankYouMessages.get('pi_123');
      expect(stored.fanName).toBe('TestFan');
      expect(stored.amount).toBe('5');
    });

    it('should handle missing Anthropic API key', async () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      const event = mockEvent();
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.messageGenerated).toBe(false);
      process.env.ANTHROPIC_API_KEY = originalKey;
    });

    it('should handle missing metadata gracefully', async () => {
      const event = mockEvent({
        body: JSON.stringify({
          notificationType: 'payment.confirmed',
          data: { id: 'pi_999', amount: { amount: '10' } },
        }),
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      const stored = handler.thankYouMessages.get('pi_999');
      expect(stored.fanName).toBe('Fan'); // default
    });

    it('should handle Claude API failure gracefully', async () => {
      mockAnthropicInstance.messages.create.mockRejectedValueOnce(new Error('API error'));

      const event = mockEvent();
      const result = await handler.handler(event);

      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.messageGenerated).toBe(false);
    });
  });

  describe('Payment failure', () => {
    it('should handle payment failures', async () => {
      const event = mockEvent({
        body: JSON.stringify({
          notificationType: 'payment.failed',
          data: { id: 'pi_fail' },
        }),
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Payment failure recorded');
    });
  });

  describe('Unknown notification', () => {
    it('should accept unknown notification types', async () => {
      const event = mockEvent({
        body: JSON.stringify({
          notificationType: 'unknown.type',
          data: {},
        }),
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
    });
  });

  describe('Storage management', () => {
    it('should limit stored messages to 100', async () => {
      // Pre-fill exactly 100 messages
      for (let i = 0; i < 100; i++) {
        handler.thankYouMessages.set(`pi_${i}`, {
          message: `Thanks ${i}`,
          timestamp: new Date().toISOString(),
        });
      }

      // Trigger a new webhook
      const event = mockEvent({
        body: JSON.stringify({
          notificationType: 'payment.confirmed',
          data: {
            id: 'pi_new',
            amount: { amount: '5' },
            metadata: { fanName: 'NewFan' },
          },
        }),
      });
      await handler.handler(event);

      // Should have evicted oldest entry to maintain max 100
      expect(handler.thankYouMessages.has('pi_0')).toBe(false);
      expect(handler.thankYouMessages.has('pi_new')).toBe(true);
      expect(handler.thankYouMessages.size).toBe(100);
    });
  });
});
