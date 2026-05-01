const handler = require('../netlify/functions/orbit/payments/create');

// Mock services
jest.mock('../backend/services/payments-create.js', () => ({
  createPayment: jest.fn().mockResolvedValue({
    paymentId: 'pending_timestamp123',
    walletAddress: '0x1234567890abcdef',
    amountUSDC: 5.5,
    originalCurrency: 'EUR',
    originalAmount: 5,
    expiresAt: new Date().toISOString(),
    status: 'PENDING',
  }),
}));

jest.mock('../backend/services/conversion.js', () => ({
  convertEURtoUSDC: jest.fn().mockResolvedValue(5.5),
}));

jest.mock('../backend/services/kiloClaw.js', () => ({
  kiloClawStage1Validate: jest.fn().mockResolvedValue({ approved: true, reason: 'APPROVED', code: 201 }),
}));

describe('POST /orbit/payments/create', () => {
  const mockEvent = (overrides = {}) => ({
    httpMethod: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer valid.jwt.token',
      origin: 'http://localhost:3000',
      ...(overrides.headers || {}),
    },
    body: JSON.stringify({
      agentId: 'agent_123',
      artistId: 'allyson_glado',
      amount: 5,
      currency: 'EUR',
    }),
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
      expect(result.headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
    });
  });

  describe('JWT Authentication', () => {
    it('should reject missing token', async () => {
      const event = mockEvent({ headers: {} });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(401);
    });

    it('should reject invalid token', async () => {
      const event = mockEvent({
        headers: { Authorization: 'Bearer invalid.token' },
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(401);
    });
  });

  describe('Input Validation', () => {
    it('should reject missing required fields', async () => {
      const event = mockEvent({ body: JSON.stringify({ amount: 5 }) }); // missing artistId
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
    });

    it('should reject invalid currency', async () => {
      const event = mockEvent({
        body: JSON.stringify({ ...JSON.parse(mockEvent().body), currency: 'USD' }),
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
    });

    it('should reject invalid amount range', async () => {
      const event = mockEvent({
        body: JSON.stringify({ ...JSON.parse(mockEvent().body), amount: 0 }),
      });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(400);
    });
  });

  describe('Payment Creation', () => {
    it('should successfully create EUR payment', async () => {
      const event = mockEvent();
      const result = await handler.handler(event);

      expect(result.statusCode).toBe(201);
      const data = JSON.parse(result.body);
      expect(data.paymentId).toBeDefined();
      expect(data.amountUSDC).toBe(5.5);
      expect(data.status).toBe('PENDING');
    });

     it('should create USDC payment without conversion', async () => {
       const { convertEURtoUSDC } = require('../backend/services/conversion.js');
       convertEURtoUSDC.mockClear();

      const event = mockEvent({
        body: JSON.stringify({
          agentId: 'agent_123',
          artistId: 'allyson_glado',
          amount: 10,
          currency: 'USDC',
        }),
      });
      const result = await handler.handler(event);

      expect(result.statusCode).toBe(201);
      expect(convertEURtoUSDC).not.toHaveBeenCalled();
    });
  });

  describe('Error Responses', () => {
    it('should return 500 for server errors', async () => {
      const { createPayment } = require('../backend/services/payments-create.js');
      createPayment.mockRejectedValueOnce(new Error('Database error'));

      const event = mockEvent();
      const result = await handler.handler(event);

      expect(result.statusCode).toBe(500);
    });
  });

  describe('Method Validation', () => {
    it('should reject non-POST methods', async () => {
      const event = mockEvent({ httpMethod: 'GET' });
      const result = await handler.handler(event);
      expect(result.statusCode).toBe(405);
    });
  });
});
