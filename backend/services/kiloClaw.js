// ORBIT 2.0 - KiloClaw Stage 1 Validator
// Pre-payment validation to ensure agents are legitimate and within limits

async function kiloClawStage1Validate(agentId, jwtToken, artistId, amount, db) {
  const intention = 'Validate agent + permissions before creating payment';
  logIntent(intention);

  // CHECK 1: Agent Active
  const agent = await db.agents.findById(agentId);
  if (!agent) {
    return { approved: false, reason: 'AGENT_NOT_FOUND', code: 404 };
  }

  if (agent.status !== 'ACTIVE') {
    logSecurityEvent({ type: 'INACTIVE_AGENT_ATTEMPT', agentId, status: agent.status });
    return { approved: false, reason: 'AGENT_NOT_ACTIVE', code: 403 };
  }

  // CHECK 2: Reputation Threshold
  if (agent.behavior_score < 30) {
    logForManualReview({
      type: 'LOW_REPUTATION_TIP',
      agentId,
      behaviorScore: agent.behavior_score,
      artistId,
      amount,
    });
    return { approved: false, reason: 'MANUAL_REVIEW_REQUIRED', code: 403 };
  }

  // CHECK 3: Artist Permissions (blocking)
  const permission = await db.artist_agent_permissions.findByArtistAndAgent(artistId, agentId);
  if (permission && !permission.can_access) {
    return { approved: false, reason: 'ARTIST_BLOCKED_AGENT', code: 403 };
  }

  // CHECK 4: Daily Limit (per artist)
  const tipsTodayPromises = await Promise.all([
    db.payments.countByArtistToday(agentId, artistId),
    db.pending_payments.countByArtistToday(agentId, artistId),
  ]);
  const totalTipsToday = tipsTodayPromises[0] + tipsTodayPromises[1];
  const dailyLimit = permission?.daily_query_limit ?? 10;

  if (totalTipsToday >= dailyLimit) {
    return {
      approved: false,
      reason: 'DAILY_LIMIT_EXCEEDED',
      code: 429,
      retryAfter: 86400,
    };
  }

  // CHECK 5: Global Rate Limit
  const tipsGlobalToday = await db.payments.countGlobalToday(agentId);
  if (tipsGlobalToday >= 50) {
    return { approved: false, reason: 'GLOBAL_LIMIT_EXCEEDED', code: 429 };
  }

  // CHECK 6: Duplicate Check (same amount within 60 seconds)
  const lastTip = await db.payments.findLastByAgentAndArtist(agentId, artistId);
  if (lastTip && lastTip.amount === amount) {
    const timeSinceLast = Date.now() - lastTip.created_at;
    if (timeSinceLast < 60000) {
      return {
        approved: false,
        reason: 'DUPLICATE_TIP',
        code: 429,
        retryAfter: Math.ceil((60000 - timeSinceLast) / 1000),
      };
    }
  }

  // CHECK 7: Amount Validation
  if (amount <= 0) {
    return { approved: false, reason: 'INVALID_AMOUNT', code: 400 };
  }
  if (amount > 1000) {
    return { approved: false, reason: 'AMOUNT_EXCEEDS_MAXIMUM', code: 400 };
  }

  // AUDIT TRAIL
  logAuditTrail({
    action: 'KILOCLAW_STAGE1_APPROVED',
    agentId,
    artistId,
    amount,
    timestamp: Date.now(),
    signature: hash({ agentId, artistId, amount }),
  });

  return { approved: true, reason: 'APPROVED', code: 201 };
}

// Stub logging functions
function logIntent(intention) {
  console.log(`[Intent] ${intention}`);
}

function logSecurityEvent(event) {
  console.log(`[Security] ${event.type} for agent ${event.agentId}`, event);
}

function logForManualReview(data) {
  console.log(`[Manual Review] ${data.type} - Agent: ${data.agentId}, Score: ${data.behaviorScore}`);
}

function logAuditTrail(data) {
  console.log(`[Audit] ${data.action} - ${data.agentId} → ${data.artistId} (${data.amount} USDC)`);
}

function hash(data) {
  return `${data.agentId}_${data.artistId}_${data.amount}_${Date.now()}`;
}

module.exports = {
  kiloClawStage1Validate,
  hash,
  logIntent,
  logSecurityEvent,
  logForManualReview,
  logAuditTrail,
};
