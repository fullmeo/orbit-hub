const handler = require('../netlify/functions/orbit/payments/status');

jest.mock('../backend/services/payments-status.js', () => ({
  getPaymentStatus: jest.fn().mockResolvedValue({
    paymentId: 'payment_123',
    status: 'pending',
    walletAddress: '0x123',
    amountUSDC: 5.5,
  }),
}));

describe('GET /orbit/payments/:paymentId/status', () => {
  const mockEvent = (overrides = {}) => ({
    httpMethod: 'GET',
    headers: {
      Authorization: 'Bearer valid.jwt.token',
      ...(overrides.headers || {}),
    },
    pathParameters: {
      paymentId: 'payment_123',
    },
    queryStringParameters: {},
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CORS', () => {
    it('should handle OPTIONS', async () => {
      const event = mockEvent({ httpMethod: 'OPTIONS' });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(200);
    });
  });

  describe('Authentication', () => {
    it('should require JWT', async () => {
      const event = mockEvent({ headers: {} });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(401);
    });
  });

  describe('Status Retrieval', () => {
    it('should return payment status', async () => {
      const event = mockEvent();
      const result = await handler.handler(event);

      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.paymentId).toBe('payment_123');
      expect(data.status).toBe('pending');
    });

    it('should handle completed payment with transaction hash', async () => {
      const { getPaymentStatus } = require('../backend/services/payments-status.js');
      getPaymentStatus.mockResolvedValueOnce({
        paymentId: 'payment_123',
        status: 'completed',
        walletAddress: '0x123',
        amountUSDC: 5.5,
        transactionHash: '0xabc',
        artistReceived: 4.95,
        platformFee: 0.55,
        completedAt: new Date().toISOString(),
      });

      const event = mockEvent();
      const result = await handler.handler(event);

      expect(result.statusCode).toBe(200);
      const data = JSON.parse(result.body);
      expect(data.transactionHash).toBe('0xabc');
    });
  });

  describe('Authorization', () => {
    it('should reject if agentId does not match', async () => {
      const { getPaymentStatus } = require('../backend/services/payments-status.js');
      getPaymentStatus.mockRejectedValueOnce(new Error('Unauthorized'));

      const event = mockEvent();
      const result = await handler.handler(event);

      expect(result.statusCode).toBe(403);
    });

    it('should return 404 for non-existent payment', async () => {
      const { getPaymentStatus } = require('../backend/services/payments-status.js');
      getPaymentStatus.mockRejectedValueOnce(new Error('Payment not found'));

      const event = mockEvent();
      const result = await handler.handler(event);

      expect(result.statusCode).toBe(404);
    });
  });

  describe('Cache Headers', () => {
    it('should include no-cache header', async () => {
      const event = mockEvent();
      const result = await handler.handler(event);

      expect(result.headers['Cache-Control']).toBe('no-cache');
    });
  });

  describe('Method Validation', () => {
    it('should reject POST', async () => {
      const event = mockEvent({ httpMethod: 'POST' });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(405);
    });
  });
});
