const handler = require('../netlify/functions/get-thanks');
const circleWebhook = require('../netlify/functions/circle-webhook');

describe('Get Thank You Message API', () => {
  const mockEvent = (overrides = {}) => ({
    httpMethod: 'GET',
    headers: {
      host: 'localhost:3000',
      ...(overrides.headers || {}),
    },
    queryStringParameters: {
      paymentId: 'pi_123',
      ...(overrides.queryStringParameters || {}),
    },
    ...overrides,
  });

  beforeEach(() => {
    circleWebhook.thankYouMessages.clear();
  });

  describe('CORS handling', () => {
    it('should handle OPTIONS requests', async () => {
      const event = mockEvent({ httpMethod: 'OPTIONS' });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      expect(result.headers['Access-Control-Allow-Origin']).toBeDefined();
    });

    it('should return allowed origin for non-localhost host', async () => {
      circleWebhook.thankYouMessages.set('pi_123', {
        message: 'Thanks',
        amount: '5',
        fanName: 'Fan',
        timestamp: new Date().toISOString(),
      });

      const event = mockEvent({
        headers: { host: 'example.com' },
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
      expect(result.headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
    });
  });

  describe('Method validation', () => {
    it('should reject non-GET methods', async () => {
      const event = mockEvent({ httpMethod: 'POST' });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(405);
    });
  });

  describe('Query parameter validation', () => {
    it('should require paymentId', async () => {
      const event = mockEvent({ queryStringParameters: {} });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('paymentId query parameter required');
    });
  });

  describe('Message retrieval', () => {
    it('should return thank you message when found', async () => {
      // Pre-populate store
      circleWebhook.thankYouMessages.set('pi_123', {
        message: 'Merci pour ton tip!',
        amount: '5',
        fanName: 'TestFan',
        timestamp: new Date().toISOString(),
      });

      const event = mockEvent();
      const result = await handler.handler(event);

      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.success).toBe(true);
      expect(data.found).toBe(true);
      expect(data.message).toBe('Merci pour ton tip!');
      expect(data.amount).toBe('5');
      expect(data.fanName).toBe('TestFan');
    });

    it('should return 404 when message not found', async () => {
      const event = mockEvent({ queryStringParameters: { paymentId: 'pi_unknown' } });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(404);
      const data = JSON.parse(result.body);
      expect(data.found).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle internal errors gracefully', async () => {
      // Force an error by throwing in the get call
      const originalGet = circleWebhook.thankYouMessages.get;
      circleWebhook.thankYouMessages.get = () => { throw new Error('forced error'); };
      const event = mockEvent();
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(500);
      circleWebhook.thankYouMessages.get = originalGet;
    });
  });
});
