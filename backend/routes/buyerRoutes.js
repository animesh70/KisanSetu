import { Router } from 'express';
import { buyers } from '../data/sampleData.js';

const router = Router();
router.get('/', (req, res) => res.json(buyers));
export default router;
