import { analyzeStartup, generateScenario, generateFeedback } from '../services/aiService.js';
import { buildInitialState, simulateStep } from '../services/simulationService.js';
import { getSession, setSession } from '../utils/store.js';
import crypto from 'crypto';

export const analyzeAndInit = async (req, res, next) => {
  try {
    const { problem, solution, target_users, budget } = req.body;
    if (!problem || !solution || !target_users || budget == null) {
      return res.status(400).json({ error: "Missing required fields: problem, solution, target_users, budget" });
    }

    // 1. AI Analysis
    const analysis = await analyzeStartup(req.body);

    // 2. Build initial state from analysis and initial budget
    const initialState = buildInitialState(analysis, budget, req.body);

    // 3. Save to memory store (QOL feature allowing frontend to track via session)
    const sessionId = crypto.randomUUID();
    setSession(sessionId, initialState);

    // Following requirements: Output pure analysis via this endpoint?
    // The requirement says "Output: { startup_type, risk_level, growth_potential, ... }"
    // But it's also helpful to return the state here if the frontend doesn't re-calculate.
    // I will return what is strictly required, plus the state and sessionId in an envelope for completeness.
    // Wait, the prompt says "Expected Output: { startup_type... }"
    // To strictly conform, we can just return the analysis, but we already have state.
    // I'll return the analysis directly, and append the initial state for the next step.

    res.json({
      ...analysis,
      _initialState: initialState, // Extra field for convenience
      _sessionId: sessionId
    });
  } catch (error) {
    next(error);
  }
};

export const simulateStepPrompt = async (req, res, next) => {
  try {
    const { state, decision } = req.body;
    if (!state || !decision) {
      return res.status(400).json({ error: "Missing state or decision field" });
    }

    // Pass the state mapping to the LLM to dynamically generate realistic new variables
    const newState = await generateMathStep(state, decision);

    res.json({ new_state: newState });
  } catch (err) {
    next(err);
  }
};

export const simulateAndProgress = async (req, res, next) => {
  try {
    const { state, decision } = req.body;
    if (!state || !decision) {
      return res.status(400).json({ error: "Missing state or decision field" });
    }

    // Apply deterministic logic
    const newState = simulateStep(state, decision);

    res.json({ new_state: newState });
  } catch (err) {
    next(err);
  }
};

export const scenarioPrompt = async (req, res, next) => {
  try {
    const { state, difficultyLevel, mode } = req.body;
    if (!state) {
      return res.status(400).json({ error: "Missing state field" });
    }

    // LLM generates a challenge
    const scenarioData = await generateScenario(state, difficultyLevel, mode);

    res.json(scenarioData);
  } catch (err) {
    next(err);
  }
};

export const feedbackPrompt = async (req, res, next) => {
  try {
    const { previous_state, decision, new_state, type, mode } = req.body;
    if (!previous_state || !decision || !new_state) {
      return res.status(400).json({ error: "Missing previous_state, decision, or new_state fields" });
    }

    // LLM generates feedback based on parameters
    const feedbackData = await generateFeedback(previous_state, decision, new_state, type || 'explain', mode);

    res.json(feedbackData);
  } catch (err) {
    next(err);
  }
};
