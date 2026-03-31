import OpenAI from 'openai';
import { simulateStep as deterministicSim } from './simulationService.js';

// Simulate network delay for mocks
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to instantiate OpenAI with OpenRouter Base URL
const getClient = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.trim() === '') return null;
  return new OpenAI({ 
    apiKey: key,
    baseURL: 'https://openrouter.ai/api/v1'
  });
};

export const analyzeStartup = async (startupData) => {
  const { problem, solution, target_users, budget, mode, stage, team_capability, monetization } = startupData;
  const isNGO = mode === 'nonprofit';
  console.log(`🤖 Analyzing (Mode: ${mode || 'business'})... [Key provided: ${!!process.env.OPENAI_API_KEY}]`);

  const openai = getClient();
  if (openai) {
    try {
      const systemPrompt = isNGO 
        ? `You are an expert NGO and Non-Profit grant evaluator. Analyze the following non-profit pitch and output JSON strictly matching this schema: 
{
  "startup_type": "string (e.g., Charity, NGO, Social Enterprise)",
  "risk_level": "low" | "medium" | "high",
  "growth_potential": "low" | "medium" | "high",
  "competition": "low" | "medium" | "high",
  "mission_alignment_score": number (0-100),
  "efficiency_score": number (0-100),
  "weaknesses": ["string"],
  "suggestions": ["string"]
}`
        : `You are an expert startup analyst. Analyze the following startup pitch and output JSON strictly matching this schema: 
{
  "startup_type": "string (e.g., SaaS, B2C, Hardware, Marketplace)",
  "risk_level": "low" | "medium" | "high",
  "growth_potential": "low" | "medium" | "high",
  "competition": "low" | "medium" | "high",
  "idea_clarity_score": number (0-100),
  "market_fit_score": number (0-100),
  "weaknesses": ["string"],
  "suggestions": ["string"]
}`;

      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Problem: ${problem}\nSolution: ${solution}\nTarget Community: ${target_users}\nInitial Funding: $${budget}\nCurrent Stage: ${stage || 'Not specified'}\nTeam Capability: ${team_capability || 'Not specified'}\nMonetization/Funding Model: ${monetization || 'Not specified'}`
          }
        ]
      });
      return JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      console.error("OpenAI Error, falling back to mock:", err.message);
    }
  }

  // --- MOCK FALLBACK ---
  await delay(1500);
  if (isNGO) {
    return {
      startup_type: "NGO",
      risk_level: budget < 10000 ? "high" : "medium",
      growth_potential: "high",
      competition: "low",
      mission_alignment_score: 95,
      efficiency_score: 80,
      weaknesses: ["Resource distribution bottlenecks", "Burnout risk for volunteers"],
      suggestions: ["Partner with local community leaders", "Set up recurring micro-donations"]
    };
  }

  return {
    startup_type: "SaaS",
    risk_level: budget < 10000 ? "high" : "medium",
    growth_potential: "high",
    competition: "medium",
    idea_clarity_score: 85,
    market_fit_score: 70,
    weaknesses: ["Limited initial runway validation", "Potential high customer acquisition cost"],
    suggestions: ["Focus on an immediate niche to secure early adopters", "Leverage organic growth loops"]
  };
};

export const generateScenario = async (currentState, difficultyLevel = "Medium", mode = "business") => {
  const isNGO = mode === 'nonprofit';
  console.log(`🤖 Generating scenario (Mode: ${mode})...`);
  
  const openai = getClient();
  if (openai) {
    try {
      const systemPrompt = isNGO 
        ? `You are a realistic simulation engine for a Non-Profit NGO. 
Generate a realistic monthly curveball or opportunity for an NGO described as: 
Problem: ${currentState.pitch?.problem}
Solution: ${currentState.pitch?.solution}
Target Demographic: ${currentState.pitch?.target_users}
Stage: ${currentState.pitch?.stage || 'Idea'}
Team: ${currentState.pitch?.team_capability || 'Solo'}
Funding Model: ${currentState.pitch?.monetization || 'Donations'}

The difficulty setting is: ${difficultyLevel}. Tailor the severity of the scenario to this tier.

CRITICAL INSTRUCTION: You MUST generate EXACTLY 5 choices for the user to pick from. 
- 2 choices must be structurally sound, representing safe, thoughtful leadership (more Pros than Cons).
- 1 choice must be a true compromise (equal Pros and Cons).
- 2 choices MUST be deceptive "trap" options: these should sound like highly attractive 'quick wins' or completely reasonable actions, but secretly carry massive hidden risks, create severe long-term debt, or completely fail to address the root problem.

Do NOT wrap the scenario string in internal quotation marks. Output JSON exactly like this:
{
  "scenario": "A 2-sentence description of the event...",
  "tier": "${difficultyLevel}",
  "choices": [
    { "action": "String describing the first sound option" },
    { "action": "String describing the second sound option" },
    { "action": "String describing the neutral compromise" },
    { "action": "String describing the first highly risky/negative option" },
    { "action": "String describing the second highly risky/negative option" }
  ]
}`
        : `You are a realistic simulation engine for a Tech Startup.
Generate a realistic monthly market shift, product failure, or competitor action for a startup described as:
Problem: ${currentState.pitch?.problem}
Solution: ${currentState.pitch?.solution}
Target Users: ${currentState.pitch?.target_users}
Stage: ${currentState.pitch?.stage || 'Idea'}
Team: ${currentState.pitch?.team_capability || 'Solo'}
Revenue Model: ${currentState.pitch?.monetization || 'Subscription'}

The difficulty setting is: ${difficultyLevel}. Tailor the severity of the scenario to this tier.

CRITICAL INSTRUCTION: You MUST generate EXACTLY 5 choices for the user to pick from. 
- 2 choices must be structurally sound, representing safe, thoughtful leadership (more Pros than Cons).
- 1 choice must be a true compromise (equal Pros and Cons).
- 2 choices MUST be deceptive "trap" options: these should sound like highly attractive 'quick wins' or completely reasonable actions, but secretly carry massive hidden risks, create severe long-term debt, or completely fail to address the root problem.

Do NOT wrap the scenario string in internal quotation marks. Output JSON exactly like this:
{
  "scenario": "A 2-sentence description of the event...",
  "tier": "${difficultyLevel}",
  "choices": [
    { "action": "String describing the first sound option" },
    { "action": "String describing the second sound option" },
    { "action": "String describing the neutral compromise" },
    { "action": "String describing the first highly risky/negative option" },
    { "action": "String describing the second highly risky/negative option" }
  ]
}`;

      const stateContext = isNGO 
        ? `Current State (Month ${currentState.month}): Funding $${currentState.budget}, Lives Impacted: ${currentState.users}, Ops Risk: ${currentState.risk}%, Community Trust: ${currentState.retention}%.`
        : `Current State (Month ${currentState.month}): Budget $${currentState.budget}, Users: ${currentState.users}, Risk: ${currentState.risk}%, Retention: ${currentState.retention}%.`;

      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: stateContext }
        ]
      });
      return JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      console.error("OpenAI Error, falling back to mock:", err.message);
    }
  }

  // --- MOCK FALLBACK ---
  await delay(1500);
  return {
    scenario: isNGO 
      ? `A local crisis requires immediate relief supplies for your community (${currentState.pitch?.target_users || 'people in need'}). Your funding is tight, but immediate action is expected.`
      : `A prominent competitor just launched a highly aggressive ad campaign targeting your core ${currentState.pitch?.target_users || 'users'}.`,
    tier: difficultyLevel,
    choices: isNGO 
      ? [
          { action: "Deploy Funds Immediately", preview: "↑ Impact, ↓ Funding" },
          { action: "Rally Volunteers", preview: "↑ Trust, ↓ Ops Speed" },
          { action: "Launch Emergency Fundraiser", preview: "↑ Funding, ↑ Risk" }
        ]
      : [
          { action: "Marketing Push", preview: "↑ Users, ↓ Budget" },
          { action: "Product Stability", preview: "↑ Retention, ↓ Risk" },
          { action: "Cut Costs", preview: "↑ Runway, ↓ Growth" }
        ]
  };
};

export const generateMathStep = async (currentState, decision) => {
  const isNGO = currentState.mode === 'nonprofit';
  console.log(`🤖 Calculating rigorous math outcomes for: ${decision} (Mode: ${currentState.mode})`);
  
  const openai = getClient();
  if (openai) {
    try {
      const systemPrompt = isNGO
        ? `You are an incredibly realistic mathematical simulation engine for an NGO.
The user made a decision: "${decision}".
Given their current metrics, calculate the precise, highly-realistic new numerical values for their metrics based on this specific action in the real world.
If they spent money, deduct an appropriate amount from Funding. If they launched a campaign, logically alter Lives Impacted, Trust, etc.
Output JSON strictly conforming to the exact schema with the new integer values:
{
  "budget": number,
  "users": number,
  "growth": number,
  "risk": number,
  "retention": number,
  "score_breakdown": {
    "score1": number (0-100),
    "score2": number (0-100),
    "score3": number (0-100)
  }
}`
        : `You are an incredibly realistic mathematical simulation engine for a Tech Startup.
The user made a decision: "${decision}".
Given their current metrics, calculate the precise, realistic new numerical values for their metrics based on this action in the market.
If they bought ads, deduct realistically from Budget, increase Users, alter Risk/Retention realistically. 
Output JSON strictly conforming to the exact schema with your simulated integer calculations:
{
  "budget": number,
  "users": number,
  "growth": number,
  "risk": number,
  "retention": number,
  "score_breakdown": {
    "score1": number (0-100),
    "score2": number (0-100),
    "score3": number (0-100)
  }
}`;

      const stateContext = JSON.stringify({
        pitch: currentState.pitch,
        current_metrics: {
          budget: currentState.budget,
          users: currentState.users,
          growth: currentState.growth,
          risk: currentState.risk,
          retention: currentState.retention,
          score_breakdown: currentState.score_breakdown
        }
      });

      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: stateContext }
        ]
      });
      const newMetrics = JSON.parse(completion.choices[0].message.content);
      
      // Calculate overall score based on the new LLM metrics
      let score = 50 + (newMetrics.users / 100) + (newMetrics.retention - 80) - (newMetrics.risk / 5) + (newMetrics.budget > 50000 ? 10 : 0);
      
      return {
        ...currentState,
        month: currentState.month + 1,
        budget: newMetrics.budget,
        users: newMetrics.users,
        growth: Math.max(0, newMetrics.growth),
        risk: Math.max(0, Math.min(100, newMetrics.risk)),
        retention: Math.max(0, Math.min(100, newMetrics.retention)),
        score: Math.min(Math.max(Math.round(score), 0), 100),
        score_breakdown: newMetrics.score_breakdown
      };
    } catch (err) {
      console.error("OpenAI Error, falling back to mock math:", err.message);
    }
  }

  // Use the old deterministic file exclusively as an unbreakable offline fallback
  return deterministicSim(currentState, decision);
};

export const generateFeedback = async (previousState, decision, newState, feedbackType = "explain", mode = "business") => {
  const isNGO = mode === 'nonprofit';
  console.log(`🤖 Generating ${feedbackType} for choice: ${decision} (Mode: ${mode})`);
  
  const openai = getClient();
  if (openai) {
    try {
      let instructionText = isNGO
        ? `You are an empathetic NGO advisor evaluating an intervention for (${newState.pitch?.solution}). Evaluate their decision focusing on human impact and community trust.
SENTIMENT RUBRIC:
- "positive": The decision was highly effective and thoughtful, yielding strong community impact or funding without extreme risk.
- "neutral": The decision was a perfectly balanced trade-off (e.g. burned funding but gained equal trust).
- "negative": Use this frequently for ANY decision that resulted in a net loss, fell for a "quick win" trap, took on too much risk, burned budget without adequate gain, or had hidden negative consequences. Even slight setbacks or naive mistakes MUST be marked as "negative". Keep the feedback fair and constructive.

YOU MUST WRITE EXACTLY 3 SHORT PARAGRAPHS (MAXIMUM 250 WORDS TOTAL) of incredibly immersive, vivid elaboration detailing exactly how this decision plays out on the ground. Use line breaks between paragraphs. Offer actionable strategic suggestions. Output JSON strictly: { "feedback": "...", "suggestions": ["string"], "sentiment": "positive" | "neutral" | "negative" }`
        : `You are a realistic, objective tech startup investor giving feedback to a founder.
The startup's Problem: "${newState.pitch?.problem}"
The startup's Solution: "${newState.pitch?.solution}"
Stage: "${newState.pitch?.stage || 'Idea'}", Revenue Model: "${newState.pitch?.monetization || 'Subscription'}"

CRITICAL RULE: Do NOT use generic startup buzzwords. You MUST explicitly tether the feedback to the specific Problem and Solution above.
SENTIMENT RUBRIC:
- "positive": The decision was highly effective and thoughtful, yielding strong users/retention or securing runway without extreme risk.
- "neutral": The decision was a perfectly balanced trade-off (e.g. burned budget but gained equal users).
- "negative": Use this frequently for ANY decision that resulted in a net loss, fell for a "quick win" trap, took on too much risk, burned runway without validation, or had hidden negative consequences. Even slight setbacks or naive mistakes MUST be marked as "negative". Keep the feedback fair and actionable.

YOU MUST WRITE EXACTLY 3 SHORT PARAGRAPHS (MAXIMUM 250 WORDS TOTAL) of profound, vivid strategic elaboration outlining the consequences of their decision. Use line breaks between paragraphs. Offer actionable suggestions tailored exactly to their product. Output strictly as JSON: { "feedback": "...", "suggestions": ["string"], "sentiment": "positive" | "neutral" | "negative" }`;
      
      if(feedbackType === "summarize") {
        instructionText = isNGO
          ? `You are an empathetic NGO advisor. Summarize the operational impact of the decision in ONE profound sentence. Apply the SENTIMENT RUBRIC (positive=effective, neutral=trade-off, negative=setback). Output JSON strictly: { "feedback": "One sentence summary", "suggestions": ["string"], "sentiment": "positive" | "neutral" | "negative" }`
          : `You are an objective tech startup investor. Summarize the outcome in ONE concise, punchy sentence detailing the exact trade-off. Apply the SENTIMENT RUBRIC (positive=effective, neutral=trade-off, negative=setback). Output JSON strictly: { "feedback": "One sentence summary", "suggestions": ["string"], "sentiment": "positive" | "neutral" | "negative" }`;
      }

      const stateContext = isNGO 
        ? `Previous State: Funding $${previousState.budget}, Lives Impacted: ${previousState.users}, Ops Risk: ${previousState.risk}%.\nDecision Made: ${decision}\nNew State: Funding $${newState.budget}, Lives Impacted: ${newState.users}, Ops Risk: ${newState.risk}%.`
        : `Previous State: Budget $${previousState.budget}, Users: ${previousState.users}, Risk: ${previousState.risk}%.\nDecision Made: ${decision}\nNew State: Budget $${newState.budget}, Users: ${newState.users}, Risk: ${newState.risk}%.`;

      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: instructionText },
          { role: "user", content: stateContext }
        ]
      });
      return JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      console.error("OpenAI Error, falling back to mock:", err.message);
    }
  }

  // --- MOCK FALLBACK ---
  await delay(1500);
  return { feedback: `Impact summary: ${decision} executed. Remaining budget/funding is $${newState.budget}.` };
};
