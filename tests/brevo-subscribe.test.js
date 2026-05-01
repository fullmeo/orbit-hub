const handler = require('../netlify/functions/brevo-subscribe');

// Mock fetch
global.fetch = jest.fn();

describe('Brevo Subscribe API', () => {
  let counter = 0;
  const mockEvent = (overrides = {}) => {
    const uniqueId = ++counter;
    return {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'client-ip': `test-ip-${uniqueId}`,
        ...(overrides.headers || {}),
      },
      body: JSON.stringify({
        email: 'fan@example.com',
        source: 'website',
      }),
      ...overrides,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset rate limit store
    if (handler.RATE_LIMIT_STORE) {
      handler.RATE_LIMIT_STORE.clear();
    }
  });

  describe('Method validation', () => {
    it('should reject non-POST methods', async () => {
      const event = mockEvent({ httpMethod: 'GET' });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(405);
    });
  });

  describe('Rate limiting', () => {
    it('should allow requests within limit', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'contact123' }),
      });
      const event = mockEvent(); // uses unique client-ip by default
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
    });

    it('should extract client IP from x-forwarded-for header', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'contact123' }),
      });
      const event = mockEvent({
        headers: { 'x-forwarded-for': '203.0.113.1, 198.51.100.2' },
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      // The rate limit key uses first IP; ensure no error
    });

    it('should reject requests exceeding rate limit', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'contact123' }),
      });

      const clientIp = '127.0.0.1';
      // Exhaust rate limit (5 requests)
      for (let i = 0; i < 5; i++) {
        await handler.handler(
          mockEvent({ headers: { 'client-ip': clientIp } })
        );
      }

      const result = await handler.handler(
        mockEvent({ headers: { 'client-ip': clientIp } })
      );
      expect(result.statusCode).toBe(429);
    });
   });

  describe('JSON parsing', () => {
    it('should reject invalid JSON', async () => {
      const event = mockEvent({ body: 'not json' });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
    });
  });

  describe('Email validation', () => {
    it('should accept valid email', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '123' }),
      });
      const event = mockEvent({ body: JSON.stringify({ email: 'valid@domain.com', source: 'web' }) });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
    });

    it('should reject missing email', async () => {
      const event = mockEvent({ body: JSON.stringify({ email: '', source: 'web' }) });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
    });

    it('should reject invalid email format', async () => {
      const event = mockEvent({ body: JSON.stringify({ email: 'notanemail', source: 'web' }) });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
    });

    it('should reject email exceeding max length', async () => {
      const longEmail = 'a'.repeat(256) + '@example.com';
      const event = mockEvent({ body: JSON.stringify({ email: longEmail, source: 'web' }) });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
    });
  });

  describe('Source validation', () => {
    it('should accept valid source', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: '1' }) });
      const event = mockEvent({ body: JSON.stringify({ email: 'a@b.com', source: 'website' }) });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
    });

    it('should reject missing source', async () => {
      const event = mockEvent({ body: JSON.stringify({ email: 'a@b.com', source: '' }) });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
    });

    it('should reject source exceeding max length', async () => {
      const longSource = 'a'.repeat(101);
      const event = mockEvent({ body: JSON.stringify({ email: 'a@b.com', source: longSource }) });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
    });
  });

  describe('Configuration', () => {
    it('should return 500 when BREVO_API_KEY missing', async () => {
      const originalKey = process.env.BREVO_API_KEY;
      delete process.env.BREVO_API_KEY;
      const event = mockEvent();
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(500);
      process.env.BREVO_API_KEY = originalKey;
    });

    it('should return 500 when BREVO_LIST_ID missing', async () => {
      const originalList = process.env.BREVO_LIST_ID;
      delete process.env.BREVO_LIST_ID;
      const event = mockEvent();
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(500);
      process.env.BREVO_LIST_ID = originalList;
    });
  });

  describe('Brevo API integration', () => {
    it('should call Brevo API with correct parameters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'new-contact' }),
      });

      const event = mockEvent({
        body: JSON.stringify({ email: 'test@example.com', source: 'landing-page' }),
      });
      await handler.handler(event);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.brevo.com/v3/contacts',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'api-key': expect.any(String),
            'Content-Type': 'application/json',
          }),
        })
      );

      const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(requestBody.email).toBe('test@example.com');
      expect(requestBody.listIds).toEqual([parseInt(process.env.BREVO_LIST_ID)]);
      expect(requestBody.attributes.SIGNUP_SOURCE).toBe('landing-page');
    });

    it('should handle duplicate contact gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Contact already exists'),
      });

      const event = mockEvent();
      const result = await handler.handler(event);

      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Already subscribed');
    });

    it('should handle other Brevo errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error'),
      });

      const event = mockEvent();
      const result = await handler.handler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Failed to subscribe. Please try again.');
    });
  });
});
