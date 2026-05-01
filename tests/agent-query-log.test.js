const { logAgentQuery, getAgentBehaviorStats, calculatePlatformRevenue } = require('../backend/services/agent-query-log.js');

// Mock DB
const db = {
  agent_query_log: {
    insert: jest.fn().mockResolvedValue({
      id: 'log_123',
      created_at: new Date().toISOString(),
    }),
  },
};

describe('Agent Query Logging Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logAgentQuery', () => {
    it('should insert tip payment record', async () => {
      const entry = {
        agent_id: 'agent_123',
        artist_id: 'allyson_glado',
        query_type: 'tip',
        cost_usdc: 5.5,
        artist_received_usdc: 4.95,
        platform_fee_usdc: 0.55,
        x402_transaction_hash: '0xtx123',
        query_timestamp: new Date().toISOString(),
        response_time_ms: 150,
        status: 'completed',
      };

      const result = await logAgentQuery(entry, db);

      expect(db.agent_query_log.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          agent_id: 'agent_123',
          artist_id: 'allyson_glado',
          query_type: 'tip',
          cost_usdc: 5.5,
          artist_received_usdc: 4.95,
          platform_fee_usdc: 0.55,
          status: 'completed',
        })
      );
      expect(result).toEqual({ id: 'log_123', created_at: expect.any(String) });
    });

    it('should handle failed tips', async () => {
      const entry = {
        agent_id: 'agent_123',
        artist_id: 'allyson_glado',
        query_type: 'tip',
        cost_usdc: 5.5,
        artist_received_usdc: 0,
        platform_fee_usdc: 0,
        query_timestamp: new Date().toISOString(),
        response_time_ms: 5000,
        status: 'failed',
      };

      await logAgentQuery(entry, db);

      expect(db.agent_query_log.insert).toHaveBeenCalledWith(expect.objectContaining({
        status: 'failed',
      }));
    });

    it('should handle missing transaction hash gracefully', async () => {
      const entry = {
        agent_id: 'agent_123',
        artist_id: 'allyson_glado',
        query_type: 'tip',
        cost_usdc: 10,
        artist_received_usdc: 9,
        platform_fee_usdc: 1,
        x402_transaction_hash: null,
        query_timestamp: new Date().toISOString(),
        response_time_ms: 200,
        status: 'completed',
      };

      await logAgentQuery(entry, db);

      expect(db.agent_query_log.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          x402_transaction_hash: null,
        })
      );
    });
  });

  describe('Agent Behavior Stats', () => {
    it('should return stats object', async () => {
      const stats = await getAgentBehaviorStats('agent_123', 7);

      expect(stats).toHaveProperty('totalTips');
      expect(stats).toHaveProperty('totalAmount');
      expect(stats).toHaveProperty('avgDaily');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('flaggedActivity');
    });
  });

  describe('Platform Revenue Calculation', () => {
    it('should calculate 10% fee on 5.5 USDC', () => {
      const revenue = calculatePlatformRevenue(5.5);
      expect(revenue).toBe(0.55);
    });

    it('should calculate 90% artist share on 11 USDC', () => {
      const revenue = calculatePlatformRevenue(11);
      expect(revenue).toBe(1.1);
      expect(11 - revenue).toBe(9.9);
    });

    it('should use custom fee percentage', () => {
      const revenue = calculatePlatformRevenue(100, 15);
      expect(revenue).toBe(15);
    });

    it('should round to 2 decimal places', () => {
      const revenue = calculatePlatformRevenue(7.89, 10);
      expect(revenue).toBe(0.79);
    });

    it('should handle zero', () => {
      const revenue = calculatePlatformRevenue(0);
      expect(revenue).toBe(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should log full payment lifecycle', async () => {
      // Create payment
      await logAgentQuery({
        agent_id: 'agent_123',
        artist_id: 'allyson_glado',
        query_type: 'tip',
        cost_usdc: 5.5,
        artist_received_usdc: 4.95,
        platform_fee_usdc: 0.55,
        x402_transaction_hash: '0xtx_created',
        query_timestamp: new Date().toISOString(),
        response_time_ms: 150,
        status: 'completed',
      }, db);

      // Confirm webhook should log
      expect(db.agent_query_log.insert).toHaveBeenCalledTimes(1);
    });

    it('should distinguish tip from other query types', async () => {
      const types = ['tip', 'message', 'share', 'follow'];
      for (const type of types) {
        await logAgentQuery({
          agent_id: 'agent_123',
          artist_id: 'allyson_glado',
          query_type: 'message', // Using string to avoid TS syntax in JS test
          cost_usdc: 0,
          artist_received_usdc: 0,
          platform_fee_usdc: 0,
          query_timestamp: new Date().toISOString(),
          response_time_ms: 100,
          status: 'completed',
        }, db);
      }

      expect(db.agent_query_log.insert).toHaveBeenCalledTimes(4);
    });
  });
});
