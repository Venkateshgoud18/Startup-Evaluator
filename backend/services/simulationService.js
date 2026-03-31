/**
 * Simulation Service
 * Handles deterministic simulation logic (non-AI based)
 */

export const buildInitialState = (analysisOutput, initialBudget, startupData) => {
  const isNGO = startupData.mode === 'nonprofit';

  // Map string enums to numeric representations
  const riskMap = { "low": 10, "medium": 30, "high": 60 };
  const growthMap = { "low": 2, "medium": 5, "high": 12 };
  
  const budget = initialBudget || 10000;
  
  // Decide initial users/impact based on type
  let users = 0;
  if (isNGO) {
    users = 100; // Lives impacted initially
  } else if (analysisOutput.startup_type === "B2C") {
    users = 500;
  } else if (analysisOutput.startup_type === "SaaS") {
    users = 50;
  } else if (analysisOutput.startup_type === "Hardware") {
    users = 10;
  } else {
    users = 100;
  }
  
  const growth = growthMap[analysisOutput.growth_potential] || 5;
  const risk = riskMap[analysisOutput.risk_level] || 30;
  const retention = 80; // Retention or Community Trust
  const competition = analysisOutput.competition || "medium";
  
  // Calculate basic 0-100 score based on metrics
  let score = 50 + (users / 100) + (retention - 80) - (risk / 5) + (budget > 50000 ? 10 : 0);
  score = Math.min(Math.max(Math.round(score), 0), 100);

  // Breakdown metrics for QoL dashboard
  const s1_val = isNGO ? (analysisOutput.mission_alignment_score || 90) : (analysisOutput.idea_clarity_score || 85);
  const s2_val = isNGO ? (analysisOutput.efficiency_score || 75) : (analysisOutput.market_fit_score || 70);
  const s3_val = analysisOutput.growth_potential === "high" ? 90 : 50; // Sustainability or Scalability

  return {
    mode: startupData.mode || 'business',
    pitch: { 
      problem: startupData.problem, 
      solution: startupData.solution, 
      target_users: startupData.target_users,
      stage: startupData.stage,
      team_capability: startupData.team_capability,
      monetization: startupData.monetization
    },
    month: 1,
    budget,
    users, // Represents "Lives Impacted" if NGO
    growth,
    risk,  // Represents Ops Risk if NGO
    retention, // Represents Community Trust if NGO
    competition,
    score,
    score_breakdown: {
      score1: s1_val,
      score2: s2_val,
      score3: s3_val
    }
  };
};

export const simulateStep = (currentState, decision) => {
  const isNGO = currentState.mode === 'nonprofit';
  // Create a deep copy to avoid mutating the original
  const state = JSON.parse(JSON.stringify(currentState));
  
  // Advance timeline
  state.month += 1;

  // Apply deterministic logic using dynamic LLM text heuristic
  const decStr = decision.toLowerCase();
  
  if (decStr.includes("market") || decStr.includes("ad") || decStr.includes("campaign") || decStr.includes("user") || decStr.includes("deploy") || decStr.includes("fund")) {
    // Marketing / Resource deployment equivalent
    state.users += Math.floor(state.users * ((state.growth + 10) / 100)) + (isNGO ? 20 : 50);
    state.budget -= 5000;
    state.risk += 2;
  } 
  else if (decStr.includes("product") || decStr.includes("feature") || decStr.includes("build") || decStr.includes("tech") || decStr.includes("volunteer") || decStr.includes("partner")) {
    // Product / Partnership equivalent
    state.retention = Math.min(state.retention + 5, 100); // Trust or Retention goes up
    state.users += Math.floor(state.users * 0.05);
    state.budget -= 2000;
    state.risk -= 5;
  }
  else if (decStr.includes("cost") || decStr.includes("cut") || decStr.includes("fire") || decStr.includes("lean") || decStr.includes("fundraiser")) {
    // Cut costs / Raise funds equivalent
    state.budget += (isNGO ? 3000 : 1000); // Fundraiser gets more money
    state.growth = Math.max(state.growth - 2, 0);
    state.retention -= 2; // Trust/Retention drops slightly due to overhead
    state.risk -= 5;
  }
  else {
    // Neutral operational burn
    state.users += Math.floor(state.users * (state.growth / 100)); // Organic impact growth
    state.budget -= 1500;
  }

  // Adjust sub-scores dynamically
  if (state.score_breakdown) {
    if (decStr.includes("market") || decStr.includes("ad") || decStr.includes("campaign") || decStr.includes("user") || decStr.includes("deploy") || decStr.includes("fund")) {
      state.score_breakdown.score2 = Math.min(100, state.score_breakdown.score2 + (isNGO ? 3 : 2));
      state.score_breakdown.score3 = Math.max(0, state.score_breakdown.score3 - 1);
    } 
    else if (decStr.includes("product") || decStr.includes("feature") || decStr.includes("build") || decStr.includes("tech") || decStr.includes("volunteer") || decStr.includes("partner")) {
      state.score_breakdown.score1 = Math.min(100, state.score_breakdown.score1 + 2);
      state.score_breakdown.score3 = Math.min(100, state.score_breakdown.score3 + 1);
    }
    else if (decStr.includes("cost") || decStr.includes("cut") || decStr.includes("fire") || decStr.includes("lean") || decStr.includes("fundraiser")) {
      state.score_breakdown.score3 = Math.min(100, state.score_breakdown.score3 + 3);
      state.score_breakdown.score2 = Math.max(0, state.score_breakdown.score2 - 2);
    }
  }

  // Update Score
  let score = 50 + (state.users / 100) + (state.retention - 80) - (state.risk / 5) + (state.budget > 50000 ? 10 : 0);
  state.score = Math.min(Math.max(Math.round(score), 0), 100);

  return state;
};
