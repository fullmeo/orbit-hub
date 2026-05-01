const loadHandler = () => {
  jest.resetModules();
  return require('../netlify/functions/circle-tips');
};

describe('Circle Tips API', () => {
  let handler;

  // Set up global fetch mock before all tests
  beforeAll(() => {
    global.fetch = jest.fn();
  });

  const mockEvent = (overrides = {}) => ({
    httpMethod: 'POST',
    headers: {
      'Content-Type': 'application/json',
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
      ...(overrides.headers || {}),
    },
    body: JSON.stringify({ action: 'create', amount: '5' }),
    queryStringParameters: {},
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    // Load fresh handler for each test to pick up env changes
    handler = loadHandler();
  });

  describe('CORS handling', () => {
    it('should handle OPTIONS requests', async () => {
      const event = mockEvent({ httpMethod: 'OPTIONS' });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      expect(result.headers['Access-Control-Allow-Origin']).toContain('localhost');
    });

    it('should block disallowed origins', async () => {
      const event = mockEvent({
        headers: { origin: 'http://evil.com', host: 'evil.com' },
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(403);
    });
  });

  describe('Method validation', () => {
    it('should reject non-POST methods', async () => {
      const event = mockEvent({ httpMethod: 'GET' });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(405);
    });
  });

  describe('Configuration validation', () => {
    it('should return 500 when CIRCLE_API_KEY missing', async () => {
      const originalKey = process.env.CIRCLE_API_KEY;
      delete process.env.CIRCLE_API_KEY;
      // Reload handler to pick up missing env
      handler = loadHandler();
      const event = mockEvent();
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Server misconfigured');
      process.env.CIRCLE_API_KEY = originalKey;
    });

    it('should return 500 when CIRCLE_WALLET_ID missing', async () => {
      const originalWallet = process.env.CIRCLE_WALLET_ID;
      delete process.env.CIRCLE_WALLET_ID;
      handler = loadHandler();
      const event = mockEvent();
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Server misconfigured');
      process.env.CIRCLE_WALLET_ID = originalWallet;
    });
  });

  describe('JSON parsing', () => {
    it('should reject invalid JSON', async () => {
      const event = mockEvent({ body: 'invalid json' });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
    });
  });

  describe('Amount validation', () => {
    it('should accept small amount', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: { id: 'pi_123', status: 'pending', amount: { amount: '5' }, metadata: {} },
        }),
      });
      const event = mockEvent({ body: JSON.stringify({ action: 'create', amount: 'small' }) });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.amount).toBe('5');
    });

    it('should accept large amount', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: { id: 'pi_123', status: 'pending', amount: { amount: '10' }, metadata: {} },
        }),
      });
      const event = mockEvent({ body: JSON.stringify({ action: 'create', amount: 'large' }) });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.amount).toBe('10');
    });

    it('should accept custom numeric amount', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: { id: 'pi_123', status: 'pending', amount: { amount: '25.50' }, metadata: {} },
        }),
      });
      const event = mockEvent({ body: JSON.stringify({ action: 'create', amount: '25.50' }) });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.amount).toBe('25.50');
    });

    it('should reject invalid amount', async () => {
      const event = mockEvent({ body: JSON.stringify({ action: 'create', amount: 'invalid' }) });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
    });
  });

  describe('Payment creation', () => {
    it('should create payment intent successfully', async () => {
      const mockPaymentResponse = {
        ok: true,
        json: () => Promise.resolve({
          data: {
            id: 'pi_123456',
            status: 'pending',
            amount: { amount: '5', currency: 'USD' },
            metadata: { artist: 'Allyson Glado', type: 'fan_tip' },
          },
        }),
      };
      global.fetch.mockResolvedValueOnce(mockPaymentResponse);

      const event = mockEvent({ body: JSON.stringify({ action: 'create', amount: '5' }) });
      const result = await handler.handler(event);

      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.success).toBe(true);
      expect(data.paymentId).toBe('pi_123456');
      expect(data.currency).toBe('USDC');
    });

    it('should handle Circle API error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Invalid request'),
      });

      const event = mockEvent({ body: JSON.stringify({ action: 'create', amount: '5' }) });
      const result = await handler.handler(event);

      expect(result.statusCode).toBe(500);
      const data = JSON.parse(result.body);
      expect(data.error).toBe('Failed to create payment');
    });
  });

  describe('Payment status checking', () => {
    it('should check payment status successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: {
            id: 'pi_123456',
            status: 'confirmed',
            amount: { amount: '5', currency: 'USD' },
          },
        }),
      });

      const event = mockEvent({
        body: JSON.stringify({ action: 'check-status', paymentId: 'pi_123456' }),
      });
      const result = await handler.handler(event);

      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.success).toBe(true);
      expect(data.status).toBe('confirmed');
      expect(data.confirmed).toBe(true);
    });

    it('should handle Circle API error on status check', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Not found'),
      });

      const event = mockEvent({
        body: JSON.stringify({ action: 'check-status', paymentId: 'pi_nonexistent' }),
      });
      const result = await handler.handler(event);

      expect(result.statusCode).toBe(500);
      const data = JSON.parse(result.body);
      expect(data.error).toBe('Failed to check payment status');
    });

    it('should require paymentId for status check', async () => {
      const event = mockEvent({
        body: JSON.stringify({ action: 'check-status' }),
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('paymentId required');
    });
  });

  describe('Invalid action', () => {
    it('should reject unknown actions', async () => {
      const event = mockEvent({
        body: JSON.stringify({ action: 'unknown' }),
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Invalid action');
    });
  });

  describe('Idempotency', () => {
    it('should generate unique idempotency keys', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'pi_test' } }),
      });
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'pi_test2' } }),
      });

      const event1 = mockEvent({ body: JSON.stringify({ action: 'create', amount: '5' }) });
      const event2 = mockEvent({ body: JSON.stringify({ action: 'create', amount: '5' }) });

      const [result1, result2] = await Promise.all([
        handler.handler(event1),
        handler.handler(event2),
      ]);

      expect(result1.statusCode).toBe(200);
      expect(result2.statusCode).toBe(200);
      const call1 = global.fetch.mock.calls[0][1];
      const call2 = global.fetch.mock.calls[1][1];
      expect(call1.headers['X-Idempotency-Key']).not.toBe(call2.headers['X-Idempotency-Key']);
    });
  });
});
