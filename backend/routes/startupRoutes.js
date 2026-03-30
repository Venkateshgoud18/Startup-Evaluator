import express from 'express';
import { analyzeAndInit, simulateAndProgress, scenarioPrompt, feedbackPrompt } from '../controllers/startupController.js';

const router = express.Router();

router.post('/analyze-startup', analyzeAndInit);
router.post('/simulate-step', simulateAndProgress);
router.post('/generate-scenario', scenarioPrompt);
router.post('/feedback', feedbackPrompt);

export default router;
