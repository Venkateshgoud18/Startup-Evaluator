/**
 * Simulation Service
 * Handles deterministic simulation logic (non-AI based)
 */

export const buildInitialState = (analysisOutput, initialBudget, startupData) => {
  // Map string enums to numeric representations
  const riskMap = { "low": 10, "medium": 30, "high": 60 };
  const growthMap = { "low": 2, "medium": 5, "high": 12 };
  
  const budget = initialBudget || 10000;
  
  // Decide initial users based on type
  let users = 0;
  if (analysisOutput.startup_type === "B2C") {
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
  const retention = 80; // Default retention percentage (0-100)
  const competition = analysisOutput.competition || "medium";
  
  // Calculate basic 0-100 score based on metrics
  let score = 50 + (users / 100) + (retention - 80) - (risk / 5) + (budget > 50000 ? 10 : 0);
  score = Math.min(Math.max(Math.round(score), 0), 100);

  // Breakdown metrics for QoL dashboard
  const idea_clarity = analysisOutput.idea_clarity_score || 85;
  const market_fit = analysisOutput.market_fit_score || 70;
  const scalability = analysisOutput.growth_potential === "high" ? 90 : 50;

  return {
    pitch: { 
      problem: startupData.problem, 
      solution: startupData.solution, 
      target_users: startupData.target_users 
    },
    month: 1,
    budget,
    users,
    growth,
    risk,
    retention,
    competition,
    score,
    score_breakdown: {
      idea_clarity,
      market_fit,
      scalability
    }
  };
};

export const simulateStep = (currentState, decision) => {
  // Create a deep copy to avoid mutating the original
  const state = JSON.parse(JSON.stringify(currentState));
  
  // Advance timeline
  state.month += 1;

  // Apply deterministic logic using dynamic LLM text heuristic
  const decStr = decision.toLowerCase();
  
  if (decStr.includes("market") || decStr.includes("ad") || decStr.includes("campaign") || decStr.includes("user")) {
    // Marketing equivalent
    state.users += Math.floor(state.users * ((state.growth + 10) / 100)) + 50;
    state.budget -= 5000;
    state.risk += 2;
  } 
  else if (decStr.includes("product") || decStr.includes("feature") || decStr.includes("build") || decStr.includes("tech")) {
    // Product equivalent
    state.retention = Math.min(state.retention + 5, 100);
    state.users += Math.floor(state.users * 0.05);
    state.budget -= 2000;
    state.risk -= 5;
  }
  else if (decStr.includes("cost") || decStr.includes("cut") || decStr.includes("fire") || decStr.includes("lean")) {
    // Cut costs equivalent
    state.budget += 1000;
    state.growth = Math.max(state.growth - 2, 0);
    state.retention -= 2;
    state.risk -= 5;
  }
  else {
    // Neutral operational burn
    state.users += Math.floor(state.users * (state.growth / 100));
    state.budget -= 1500;
  }

  // Update Score
  let score = 50 + (state.users / 100) + (state.retention - 80) - (state.risk / 5) + (state.budget > 50000 ? 10 : 0);
  state.score = Math.min(Math.max(Math.round(score), 0), 100);

  return state;
};
