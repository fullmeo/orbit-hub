// Mock Anthropic SDK BEFOREANYTHING else
const mockAnthropicMessages = {
  create: jest.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'Hello! I am Allyson Glado' }],
  }),
};

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: mockAnthropicMessages,
  }));
});

// Set environment variables before import
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.BREVO_API_KEY = 'test-brevo-key';
process.env.ARTIST_NAME = 'Allyson Glado';

// Mock global fetch
global.fetch = jest.fn();

// Now import handler AFTER mocking
const handler = require('../netlify/functions/fan-chat');

describe('Fan Chat API', () => {
  let counter = 0;
  const baseEvent = {
    httpMethod: 'POST',
    headers: {
      'Content-Type': 'application/json',
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
    },
    body: JSON.stringify({ message: 'Hello!' }),
    queryStringParameters: {},
  };

  const mockEvent = (overrides = {}) => {
    const uniqueId = ++counter;
    return {
      ...baseEvent,
      ...overrides,
      headers: {
        ...baseEvent.headers,
        'client-ip': `test-ip-${uniqueId}`,
        ...(overrides.headers || {}),
      },
    };
  };

  beforeEach(() => {
    if (global.rateLimitStore) {
      global.rateLimitStore.clear();
    }
    // Clear Anthropic mock
    mockAnthropicMessages.create.mockClear();
    // Only clear fetch mock if it's a jest mock function
    if (global.fetch && typeof global.fetch.mockClear === 'function') {
      global.fetch.mockClear();
    }
  });

  describe('CORS handling', () => {
    it('should handle OPTIONS requests', async () => {
      const event = mockEvent({ httpMethod: 'OPTIONS' });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      expect(result.headers['Access-Control-Allow-Origin']).toContain('localhost:3000');
    });

    it('should block disallowed origins', async () => {
      const event = mockEvent({
        headers: { origin: 'http://evil.com', host: 'evil.com' },
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(403);
    });
  });

  describe('Rate limiting', () => {
    it('should allow requests within limit', async () => {
      const event = mockEvent({
        headers: { 'client-ip': '127.0.0.1' },
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
    });

    it('should reject requests exceeding rate limit', async () => {
      const clientIp = '127.0.0.1';
      // Exhaust rate limit
      for (let i = 0; i < 10; i++) {
        await handler.handler(
          mockEvent({ headers: { 'client-ip': clientIp } })
        );
      }
      // 11th request should be rate limited
      const result = await handler.handler(
        mockEvent({ headers: { 'client-ip': clientIp } })
      );
      expect(result.statusCode).toBe(429);
      expect(result.headers['Retry-After']).toBeDefined();
    });
  });

  describe('Message validation', () => {
    it('should reject empty messages', async () => {
      const event = mockEvent({
        body: JSON.stringify({ message: '' }),
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Message cannot be empty');
    });

    it('should reject messages exceeding max length', async () => {
      const longMessage = 'x'.repeat(1001);
      const event = mockEvent({
        body: JSON.stringify({ message: longMessage }),
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
    });
  });

  describe('Escalation detection', () => {
    it('should detect escalation keywords', async () => {
      const event = mockEvent({
        body: JSON.stringify({ message: 'Je veux rencontrer l\'artiste' }),
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.escalation).toBe(true);
    });

    it('should request email when escalation detected without email', async () => {
      const event = mockEvent({
        body: JSON.stringify({ message: 'Je veux collaborer avec toi' }),
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.requiresEmail).toBe(true);
    });

    it('should send escalation email when email provided', async () => {
      // Mock Brevo API success
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
      });
      const event = mockEvent({
        body: JSON.stringify({
          message: 'Je veux te contacter pour un showcase',
          email: 'fan@example.com',
        }),
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.escalation).toBe(true);
      expect(data.requiresEmail).toBe(false);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.brevo.com/v3/smtp/email',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'api-key': 'test-brevo-key',
          }),
        })
      );
    });
  });

  describe('Email submission', () => {
    it('should accept valid email after escalation', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
      });
      const event = mockEvent({
        body: JSON.stringify({
          action: 'submit_email',
          message: 'Je veux te contacter',
          email: 'valid@example.com',
          originalMessage: 'Initial message',
        }),
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.emailSent).toBe(true);
    });

    it('should reject invalid email format', async () => {
      const event = mockEvent({
        body: JSON.stringify({
          action: 'submit_email',
          email: 'invalid-email',
        }),
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
    });
  });

  describe('Normal chat (non-escalation)', () => {
    it('should return streaming response when stream=true', async () => {
      const event = mockEvent({
        queryStringParameters: { stream: 'true' },
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('text/event-stream');
      // Stream should be a readable stream with write/end methods
      expect(typeof result.body.write).toBe('function');
      expect(typeof result.body.end).toBe('function');
    });

    it('should return JSON response by default', async () => {
      const event = mockEvent();
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');
      const data = JSON.parse(result.body);
      expect(data.success).toBe(true);
      expect(data.response).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should return 500 when ANTHROPIC_API_KEY missing', async () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      const event = mockEvent();
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(500);
      process.env.ANTHROPIC_API_KEY = originalKey;
    });

    it('should return 500 when Anthropic API throws', async () => {
      mockAnthropicMessages.create.mockRejectedValueOnce(new Error('API down'));
      const event = mockEvent();
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(500);
    });

    it('should return 400 for invalid JSON', async () => {
      const event = mockEvent({
        headers: { 'client-ip': 'unique-client-123' },
        body: 'invalid json',
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
    });
  });

  describe('Escalation email edge cases', () => {
    it('should handle missing BREVO_API_KEY gracefully', async () => {
      const originalKey = process.env.BREVO_API_KEY;
      delete process.env.BREVO_API_KEY;
      // Trigger escalation with email
      const event = mockEvent({
        body: JSON.stringify({
          message: 'Je veux te contacter pour un showcase',
          email: 'fan@example.com',
        }),
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.requiresEmail).toBe(true); // emailSent is false, so requiresEmail true
      process.env.BREVO_API_KEY = originalKey;
    });

    it('should handle Brevo API error response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error'),
      });
      const event = mockEvent({
        body: JSON.stringify({
          message: 'Je veux te contacter pour un showcase',
          email: 'fan@example.com',
        }),
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.requiresEmail).toBe(true); // emailSent false
    });
  });

  describe('Non-text Anthropic response', () => {
    it('should handle non-text content block gracefully', async () => {
      mockAnthropicMessages.create.mockResolvedValueOnce({
        content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: '...' } }],
      });
      const event = mockEvent();
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.success).toBe(true);
      expect(data.response).toBe(''); // empty string fallback
    });
  });
});
