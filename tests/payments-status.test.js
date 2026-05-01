const { getPaymentStatus } = require('../backend/services/payments-status.js');

const createMockDB = (overrides = {}) => ({
  pending_payments: {
    findById: jest.fn().mockResolvedValue({
      agent_id: 'agent_123',
      artist_id: 'allyson_glado',
      amount_usdc: 5.5,
      wallet_address: '0x1234567890abcdef',
      circle_payment_id: 'pi_sandbox_123',
      status: 'pending',
      created_at: new Date(Date.now() - 60000).toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      transaction_hash: null,
      completed_at: null,
    }),
    updateStatus: jest.fn().mockResolvedValue({}),
  },
  agent_query_log: {
    insert: jest.fn().mockResolvedValue({}),
  },
  ...overrides,
});

global.fetch = jest.fn();

describe('Payment Status Service', () => {
  let db;
  const paymentId = 'payment_123';
  const agentId = 'agent_123';

  beforeEach(() => {
    db = createMockDB();
    jest.clearAllMocks();
  });

  describe('Status Retrieval', () => {
    it('should return pending status for unconfirmed payment', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'PENDING' }),
      });

      const result = await getPaymentStatus(paymentId, agentId, db);

      expect(result.status).toBe('pending');
      expect(result.amountUSDC).toBe(5.5);
      expect(result.walletAddress).toBe('0x1234567890abcdef');
    });

    it('should return completed status when Circle confirms', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'CONFIRMED', transactionHash: '0xabc123' }),
      });

      // Mock DB update to change status
      db.pending_payments.findById.mockResolvedValueOnce({
        ...db.pending_payments.findById.mock.results[0].value,
        status: 'completed',
        transaction_hash: '0xabc123',
        completed_at: new Date().toISOString(),
      });

      const result = await getPaymentStatus(paymentId, agentId, db);

      expect(result.status).toBe('completed');
      expect(result.transactionHash).toBe('0xabc123');
      expect(result.artistReceived).toBeCloseTo(4.95); // 90%
      expect(result.platformFee).toBeCloseTo(0.55); // 10%
    });

    it('should mark as expired if past expiry time', async () => {
      db.pending_payments.findById.mockResolvedValueOnce({
        agent_id: agentId,
        artist_id: 'allyson_glado',
        amount_usdc: 5.5,
        wallet_address: '0x123',
        circle_payment_id: 'pi_123',
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
      });

      const result = await getPaymentStatus(paymentId, agentId, db);

      expect(result.status).toBe('expired');
    });
  });

  describe('Authorization', () => {
    it('should reject unauthorized agent', async () => {
      db.pending_payments.findById.mockResolvedValueOnce({
        ...db.pending_payments.findById.mock.results[0].value,
        agent_id: 'different_agent',
      });

      await expect(getPaymentStatus(paymentId, agentId, db))
        .rejects.toThrow('Unauthorized');
    });

    it('should throw error for non-existent payment', async () => {
      db.pending_payments.findById.mockResolvedValueOnce(null);

      await expect(getPaymentStatus('nonexistent', agentId, db))
        .rejects.toThrow('Payment not found');
    });
  });

  describe('Audit Logging', () => {
    it('should insert into agent_query_log on completion', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'CONFIRMED', transactionHash: '0x789' }),
      });

      // After completion, status changes
      db.pending_payments.findById.mockResolvedValueOnce({
        ...db.pending_payments.findById.mock.results[0].value,
        status: 'completed',
        transaction_hash: '0x789',
        completed_at: new Date().toISOString(),
      });

      await getPaymentStatus(paymentId, agentId, db);

      expect(db.agent_query_log.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          query_type: 'tip',
          status: 'completed',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle Circle API errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API down'));

      const result = await getPaymentStatus(paymentId, agentId, db);

      // Should return current DB status
      expect(result.status).toBe('pending');
    });
  });
});
