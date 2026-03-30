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
  const { problem, solution, target_users, budget, mode } = startupData;
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
            content: `Problem: ${problem}\nSolution: ${solution}\nTarget Community: ${target_users}\nInitial Funding: $${budget}`
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
        ? `You are an empathetic, dynamic simulation engine designed to challenge Non-Profit organizations and NGOs. The user is managing an NGO with this exact premise:
Problem: ${currentState.pitch?.problem}
Solution: ${currentState.pitch?.solution}
Target Community: ${currentState.pitch?.target_users}

Based on current metrics, generate an engaging, highly specific challenge tailored entirely to their mission to help the marginalized in Month ${currentState.month}. Do not use a ruthless business mindset; focus on humanity, operational efficiency, and ethical dilemmas.
The user requested a difficulty rating of "${difficultyLevel}". Frame the stakes appropriately.
Provide 3 distinct decisions the user can make to mitigate this, along with a strategic visual preview of its impact (e.g. '↑ Lives Impacted, ↓ Funding'). Output JSON strictly:
{
  "scenario": "string detailing the empathetic challenge",
  "tier": "${difficultyLevel}",
  "choices": [ { "action": "short decision", "preview": "impact string" } ]
}`
        : `You are a dynamic startup simulation engine designed to challenge tech entrepreneurs. The user is building a startup:
Problem: ${currentState.pitch?.problem}
Solution: ${currentState.pitch?.solution}
Target Users: ${currentState.pitch?.target_users}

Based on current metrics, generate a highly specific challenge tailored to their actual product for Month ${currentState.month}.
Requested difficulty: "${difficultyLevel}". Frame stakes realistically.
Provide 3 decisions the user can make, along with a visual preview of impact (e.g. '↑ Users, ↓ Budget'). Output JSON strictly:
{
  "scenario": "string detailing the tailored challenge",
  "tier": "${difficultyLevel}",
  "choices": [ { "action": "short decision", "preview": "impact string" } ]
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

export const generateFeedback = async (previousState, decision, newState, feedbackType = "explain", mode = "business") => {
  const isNGO = mode === 'nonprofit';
  console.log(`🤖 Generating ${feedbackType} for choice: ${decision} (Mode: ${mode})`);
  
  const openai = getClient();
  if (openai) {
    try {
      let instructionText = isNGO
        ? `You are an empathetic NGO advisor evaluating an intervention for (${newState.pitch?.solution}). Evaluate their decision focusing on human impact and community trust, rather than profit. Point out if they burned too much funding or lost trust, but celebrate any increase in lives helped. YOU MUST WRITE EXACTLY 3 SHORT PARAGRAPHS (MAXIMUM 250 WORDS TOTAL) of incredibly immersive, vivid elaboration detailing exactly how this decision plays out on the ground and impacts the marginalized community in the real world. Use line breaks between paragraphs. Additionally, offer a list of actionable strategic suggestions. Output JSON strictly: { "feedback": "Maximum 250 words, highly detailed 3-paragraph explanation with line breaks...", "suggestions": ["string", "string"] }`
        : `You are a realistic, objective tech startup investor giving feedback to a founder on their specific product: (${newState.pitch?.solution}). You do NOT sugarcoat failures. Tell the founder exactly what happened—the good and the bad—based on the actual delta metrics. Keep it highly specific to their business domain. YOU MUST WRITE EXACTLY 3 SHORT PARAGRAPHS (MAXIMUM 250 WORDS TOTAL) of profound, vivid strategic elaboration outlining the systemic consequences of their decision. Use line breaks between paragraphs. Additionally, offer actionable forward-looking suggestions. Output strictly as JSON: { "feedback": "Maximum 250 words, highly detailed 3-paragraph strategic explanation with line breaks...", "suggestions": ["string", "string"] }`;
      
      if(feedbackType === "summarize") {
        instructionText = isNGO
          ? `You are an empathetic NGO advisor. Summarize the operational impact of the decision in ONE profound sentence. Output JSON: { "feedback": "One sentence summary" }`
          : `You are an objective tech startup investor. Summarize the outcome in ONE concise, punchy sentence detailing the exact trade-off. Output JSON: { "feedback": "One sentence summary" }`;
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
