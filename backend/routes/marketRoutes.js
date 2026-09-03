import { Router } from 'express';
import { getForecast, getPrices, getTrend } from '../services/marketService.js';

const router = Router();
router.get('/prices', (req, res) => res.json(getPrices(req.query)));
router.get('/trends', (req, res) => res.json(getTrend(req.query.crop)));
router.get('/forecast', async (req, res) => res.json(await getForecast(req.query.crop)));
export default router;
