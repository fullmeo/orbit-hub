// ORBIT 2.0 - Agent Query Logging Service
// Records agent behavior for Kilo analysis and revenue tracking

async function logAgentQuery(data, database) {
  try {
    const result = await database.agent_query_log.insert({
      agent_id: data.agent_id,
      artist_id: data.artist_id,
      query_type: data.query_type,
      cost_usdc: data.cost_usdc,
      artist_received_usdc: data.artist_received_usdc,
      platform_fee_usdc: data.platform_fee_usdc,
      x402_transaction_hash: data.x402_transaction_hash,
      query_timestamp: data.query_timestamp,
      response_time_ms: data.response_time_ms,
      status: data.status,
      flaggedActivity: data.flaggedActivity || false,
    });

    console.log('[AgentQueryLog]', {
      id: result.id,
      agentId: data.agent_id,
      artistId: data.artist_id,
      type: data.query_type,
      costUsdc: data.cost_usdc,
      status: data.status,
    });

    return result;
  } catch (error) {
    console.error('[AgentQueryLog] Error:', error.message);
    throw error;
  }
}

async function getAgentBehaviorStats(agentId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return {
    totalTips: 0,
    totalAmount: 0,
    avgDaily: 0,
    successRate: 0,
    flaggedActivity: false,
  };
}

function calculatePlatformRevenue(totalTipsUsdc, platformFeePercent = 10) {
  return Math.round(totalTipsUsdc * (platformFeePercent / 100) * 100) / 100;
}

module.exports = {
  logAgentQuery,
  getAgentBehaviorStats,
  calculatePlatformRevenue,
};
