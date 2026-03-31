import express from 'express';
import { analyzeAndInit, simulateAndProgress, scenarioPrompt, feedbackPrompt } from '../controllers/startupController.js';
import { signup, login } from '../controllers/userControllers.js';

const router = express.Router();

router.post('/analyze-startup', analyzeAndInit);
router.post('/simulate-step', simulateAndProgress);
router.post('/generate-scenario', scenarioPrompt);
router.post('/feedback', feedbackPrompt);
router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export default router;
