import OpenAI from 'openai';

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
  const { problem, solution, target_users, budget } = startupData;
  console.log(`🤖 Analyzing startup idea... [Key provided: ${!!process.env.OPENAI_API_KEY}]`);

  const openai = getClient();
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an expert startup analyst. Analyze the following startup pitch and output JSON strictly matching this schema: 
{
  "startup_type": "string (e.g., SaaS, B2C, Hardware, Marketplace)",
  "risk_level": "low" | "medium" | "high",
  "growth_potential": "low" | "medium" | "high",
  "competition": "low" | "medium" | "high",
  "idea_clarity_score": number (0-100),
  "market_fit_score": number (0-100),
  "weaknesses": ["string"],
  "suggestions": ["string"]
}`
          },
          {
            role: "user",
            content: `Problem: ${problem}\nSolution: ${solution}\nTarget Users: ${target_users}\nBudget: $${budget}`
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
  let startup_type = "SaaS";
  if (target_users?.toLowerCase().includes("consumer")) startup_type = "B2C";
  if (solution?.toLowerCase().includes("hardware")) startup_type = "Hardware";

  return {
    startup_type,
    risk_level: budget < 10000 ? "high" : "medium",
    growth_potential: "high",
    competition: "medium",
    idea_clarity_score: 85,
    market_fit_score: 70,
    weaknesses: ["Limited initial runway validation", "Potential high customer acquisition cost"],
    suggestions: ["Focus on an immediate niche to secure early adopters", "Leverage organic growth loops"]
  };
};

export const generateScenario = async (currentState, difficultyLevel = "Medium") => {
  console.log(`🤖 Generating scenario for current state... [Key provided: ${!!process.env.OPENAI_API_KEY}]`);
  
  const openai = getClient();
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a dynamic startup simulation engine designed to challenge tech entrepreneurs. The user is building a startup with this exact premise:
Problem: ${currentState.pitch?.problem}
Solution: ${currentState.pitch?.solution}
Target Users: ${currentState.pitch?.target_users}

Based on their current metrics, generate an engaging, highly specific challenge tailored entirely to their actual product and market for Month ${currentState.month}.
The user specifically requested a difficulty rating of "${difficultyLevel}" for this challenge. Frame the stakes appropriately.
Provide 3 specific, distinct business decisions the user can make to mitigate this challenge, along with a strategic visual preview of its expected impact (e.g. '↑ Users, ↓ Budget'). Output JSON strictly formatted as:
{
  "scenario": "string detailing the tailored challenge",
  "tier": "${difficultyLevel}",
  "choices": [
    {
       "action": "short decision string (e.g. 'Aggressive Ad Campaign')",
       "preview": "impact string (e.g. '↑ Users, ↓↓ Budget')"
    }
  ]
}
Limit choices array to exactly 3 items.`
          },
          {
            role: "user",
            content: `Current State (Month ${currentState.month}): Budget $${currentState.budget}, Users: ${currentState.users}, Growth: ${currentState.growth}%, Risk: ${currentState.risk}%, Retention: ${currentState.retention}%, Score: ${currentState.score}/100.`
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
  let scenarioDetail = `A prominent competitor just launched a highly aggressive ad campaign targeting your core ${currentState.pitch?.target_users || 'users'}.`;
  if (difficultyLevel === "Hard") scenarioDetail = `Your runway is collapsing. You need an aggressive pivot for your ${currentState.pitch?.solution || 'product'} or risk immediate failure.`;
  else if (difficultyLevel === "Easy") scenarioDetail = `You got unexpected positive press among ${currentState.pitch?.target_users || 'users'}. Time to capitalize?`;

  return {
    scenario: scenarioDetail,
    tier: difficultyLevel,
    choices: [
      { action: "Marketing Push", preview: "↑ Users, ↓ Budget" },
      { action: "Product Stability", preview: "↑ Retention, ↓ Risk" },
      { action: "Cut Costs", preview: "↑ Runway, ↓ Growth" }
    ]
  };
};

export const generateFeedback = async (previousState, decision, newState, feedbackType = "explain") => {
  console.log(`🤖 Generating ${feedbackType} for choice: ${decision} [Key provided: ${!!process.env.OPENAI_API_KEY}]`);
  
  const openai = getClient();
  if (openai) {
    try {
      let instruction = `You are a realistic, objective tech startup investor giving feedback to a founder on their specific product: (${newState.pitch?.solution}). You do NOT sugarcoat failures. Tell the founder exactly what happened—the good and the bad—based on the actual delta metrics. Keep it highly specific to their business domain. Output strictly as JSON: { "feedback": "Detailed paragraph explaining the outcome and trade-offs" }`;
      
      if(feedbackType === "summarize") {
        instruction = `You are a realistic, objective tech startup investor reviewing the product: (${newState.pitch?.solution}). Summarize the outcome of the user's decision in ONE concise, punchy sentence detailing the exact trade-off. Output strictly as JSON: { "feedback": "One sentence summary" }`;
      }

      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: instruction },
          {
            role: "user",
            content: `Previous State: Budget $${previousState.budget}, Users: ${previousState.users}, Risk: ${previousState.risk}%.\nDecision Made: ${decision}\nNew State: Budget $${newState.budget}, Users: ${newState.users}, Risk: ${newState.risk}%.`
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
  let feedback = `You decided to focus on ${decision}.`;
  if (decision.toLowerCase().includes("market")) feedback = `Aggressive push for ${newState.pitch?.solution || 'the product'}. Users spiked, but you burned massive runway. Retention must hold up.`;
  else if (decision.toLowerCase().includes("product")) feedback = `You stabilized the core feature set. Growth is slower, but retention and runway are healthier.`;
  else if (decision.toLowerCase().includes("cost")) feedback = `You successfully extended runway, but innovation has stalled. Watch out for stagnation in your niche.`;

  if (feedbackType === "summarize") {
    feedback = `Impact summary: ${decision} executed. Budget is now $${newState.budget}.`;
  }

  return { feedback };
};
