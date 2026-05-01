const { kiloClawStage1Validate } = require('../backend/services/kiloClaw.js');
const { hash, logIntent, logSecurityEvent, logForManualReview, logAuditTrail } = require('../backend/services/kiloClaw.js');

// Mock DB implementation
const createMockDB = (overrides = {}) => ({
  agents: {
    findById: jest.fn().mockResolvedValue({ status: 'ACTIVE', behavior_score: 80 }),
  },
  artist_agent_permissions: {
    findByArtistAndAgent: jest.fn().mockResolvedValue(null),
    countByDay: jest.fn().mockResolvedValue(0),
    countGlobalByDay: jest.fn().mockResolvedValue(0),
    findLastByAgentAndArtist: jest.fn().mockResolvedValue(null),
  },
  payments: {
    countByArtistToday: jest.fn().mockResolvedValue(0),
    countGlobalToday: jest.fn().mockResolvedValue(0),
    findLastByAgentAndArtist: jest.fn().mockResolvedValue(null),
  },
  pending_payments: {
    countByArtistToday: jest.fn().mockResolvedValue(0),
  },
  ...overrides,
});

describe('KiloClaw Stage 1 Validator', () => {
  let db;
  const agentId = 'agent_123';
  const artistId = 'allyson_glado';
  const jwtToken = 'valid-jwt-token';

  beforeEach(() => {
    db = createMockDB();
  });

  describe('Agent Validation', () => {
    it('should approve active agent with good reputation', async () => {
      const result = await kiloClawStage1Validate(agentId, jwtToken, artistId, 5, db);

      expect(result.approved).toBe(true);
      expect(result.reason).toBe('APPROVED');
      expect(result.code).toBe(201);
    });

    it('should reject non-existent agent', async () => {
      db.agents.findById.mockResolvedValueOnce(null);

      const result = await kiloClawStage1Validate('nonexistent', jwtToken, artistId, 5, db);

      expect(result.approved).toBe(false);
      expect(result.reason).toBe('AGENT_NOT_FOUND');
      expect(result.code).toBe(404);
    });

    it('should reject inactive agent', async () => {
      db.agents.findById.mockResolvedValueOnce({ status: 'BLOCKED', behavior_score: 80 });

      const result = await kiloClawStage1Validate(agentId, jwtToken, artistId, 5, db);

      expect(result.approved).toBe(false);
      expect(result.reason).toBe('AGENT_NOT_ACTIVE');
      expect(result.code).toBe(403);
    });

    it('should flag low reputation agent (< 30)', async () => {
      db.agents.findById.mockResolvedValueOnce({ status: 'ACTIVE', behavior_score: 25 });

      const result = await kiloClawStage1Validate(agentId, jwtToken, artistId, 5, db);

      expect(result.approved).toBe(false);
      expect(result.reason).toBe('MANUAL_REVIEW_REQUIRED');
      expect(result.code).toBe(403);
    });
  });

  describe('Artist Permissions', () => {
    it('should reject if artist blocked agent', async () => {
      db.artist_agent_permissions.findByArtistAndAgent.mockResolvedValueOnce({
        can_access: false,
      });

      const result = await kiloClawStage1Validate(agentId, jwtToken, 'blocked_artist', 5, db);

      expect(result.approved).toBe(false);
      expect(result.reason).toBe('ARTIST_BLOCKED_AGENT');
      expect(result.code).toBe(403);
    });

    it('should allow if permission exists and can_access is true', async () => {
      db.artist_agent_permissions.findByArtistAndAgent.mockResolvedValueOnce({
        can_access: true,
        daily_query_limit: 20,
      });

      const result = await kiloClawStage1Validate(agentId, jwtToken, artistId, 5, db);

      expect(result.approved).toBe(true);
    });
  });

  describe('Daily Limit Enforcement', () => {
    beforeEach(() => {
      db.agents.findById.mockResolvedValue({ status: 'ACTIVE', behavior_score: 80 });
    });

    it('should allow tips under daily limit', async () => {
      db.artist_agent_permissions.countByDay.mockResolvedValueOnce(5);
      db.payments.countByArtistToday.mockResolvedValueOnce(3);
      db.pending_payments.countByArtistToday.mockResolvedValueOnce(0);

      const result = await kiloClawStage1Validate(agentId, jwtToken, artistId, 5, db);

      expect(result.approved).toBe(true);
    });

    it('should reject if daily limit reached (default 10)', async () => {
      db.payments.countByArtistToday.mockResolvedValueOnce(10);
      db.pending_payments.countByArtistToday.mockResolvedValueOnce(0);

      const result = await kiloClawStage1Validate(agentId, jwtToken, artistId, 5, db);

      expect(result.approved).toBe(false);
      expect(result.reason).toBe('DAILY_LIMIT_EXCEEDED');
      expect(result.code).toBe(429);
      expect(result.retryAfter).toBe(86400);
    });

    it('should use custom daily limit from permissions', async () => {
      db.artist_agent_permissions.findByArtistAndAgent.mockResolvedValueOnce({
        can_access: true,
        daily_query_limit: 20,
      });
      db.artist_agent_permissions.countByDay.mockResolvedValueOnce(18);
      db.payments.countByArtistToday.mockResolvedValueOnce(1);
      db.pending_payments.countByArtistToday.mockResolvedValueOnce(0);

      const result = await kiloClawStage1Validate(agentId, jwtToken, artistId, 5, db);

      expect(result.approved).toBe(true); // 19 < 20
    });
  });

  describe('Global Rate Limit', () => {
    beforeEach(() => {
      db.agents.findById.mockResolvedValue({ status: 'ACTIVE', behavior_score: 80 });
    });

    it('should allow under global limit (50/day)', async () => {
      db.payments.countGlobalToday.mockResolvedValueOnce(40);

      const result = await kiloClawStage1Validate(agentId, jwtToken, artistId, 5, db);

      expect(result.approved).toBe(true);
    });

    it('should reject when global limit exceeded', async () => {
      db.payments.countGlobalToday.mockResolvedValueOnce(50);

      const result = await kiloClawStage1Validate(agentId, jwtToken, artistId, 5, db);

      expect(result.approved).toBe(false);
      expect(result.reason).toBe('GLOBAL_LIMIT_EXCEEDED');
      expect(result.code).toBe(429);
    });
  });

  describe('Duplicate Detection', () => {
    beforeEach(() => {
      db.agents.findById.mockResolvedValue({ status: 'ACTIVE', behavior_score: 80 });
    });

    it('should allow tips if different amount', async () => {
      const oneMinuteAgo = Date.now() - 30000;
      db.payments.findLastByAgentAndArtist.mockResolvedValueOnce({
        amount: 10,
        created_at: oneMinuteAgo,
      });

      const result = await kiloClawStage1Validate(agentId, jwtToken, artistId, 5, db);

      expect(result.approved).toBe(true);
    });

    it('should allow tips if more than 60s since last', async () => {
      const twoMinutesAgo = Date.now() - 120000;
      db.payments.findLastByAgentAndArtist.mockResolvedValueOnce({
        amount: 5,
        created_at: twoMinutesAgo,
      });

      const result = await kiloClawStage1Validate(agentId, jwtToken, artistId, 5, db);

      expect(result.approved).toBe(true);
    });

    it('should reject duplicate tip within 60s', async () => {
      const thirtySecondsAgo = Date.now() - 30000;
      db.payments.findLastByAgentAndArtist.mockResolvedValueOnce({
        amount: 5,
        created_at: thirtySecondsAgo,
      });

      const result = await kiloClawStage1Validate(agentId, jwtToken, artistId, 5, db);

      expect(result.approved).toBe(false);
      expect(result.reason).toBe('DUPLICATE_TIP');
      expect(result.code).toBe(429);
      expect(result.retryAfter).toBeLessThanOrEqual(30);
    });
  });

  describe('Amount Validation', () => {
    beforeEach(() => {
      db.agents.findById.mockResolvedValue({ status: 'ACTIVE', behavior_score: 80 });
    });

    it('should reject zero amount', async () => {
      const result = await kiloClawStage1Validate(agentId, jwtToken, artistId, 0, db);
      expect(result.approved).toBe(false);
      expect(result.reason).toBe('INVALID_AMOUNT');
    });

    it('should reject negative amount', async () => {
      const result = await kiloClawStage1Validate(agentId, jwtToken, artistId, -5, db);
      expect(result.approved).toBe(false);
    });

    it('should reject amount exceeding maximum (1000)', async () => {
      const result = await kiloClawStage1Validate(agentId, jwtToken, artistId, 1001, db);
      expect(result.approved).toBe(false);
      expect(result.reason).toBe('AMOUNT_EXCEEDS_MAXIMUM');
    });

    it('should accept boundary amount (1000)', async () => {
      const result = await kiloClawStage1Validate(agentId, jwtToken, artistId, 1000, db);
      expect(result.approved).toBe(true);
    });
  });

  describe('Audit Trail', () => {
    it('should log approval with signature', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await kiloClawStage1Validate(agentId, jwtToken, artistId, 5, db);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Audit] KILOCLAW_STAGE1_APPROVED')
      );

      consoleSpy.mockRestore();
    });

    it('should log manual review events for low reputation', async () => {
      db.agents.findById.mockResolvedValueOnce({ status: 'ACTIVE', behavior_score: 20 });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await kiloClawStage1Validate(agentId, jwtToken, artistId, 5, db);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Manual Review] LOW_REPUTATION_TIP')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Intent Fidelity', () => {
    it('should log intention at start', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await kiloClawStage1Validate(agentId, jwtToken, artistId, 5, db);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Intent]')
      );

      consoleSpy.mockRestore();
    });
  });
});

