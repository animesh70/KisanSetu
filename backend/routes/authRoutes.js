import { Router } from 'express';
import { users } from '../data/sampleData.js';

const router = Router();
router.post('/login', (req, res) => {
  const { phone = '9876543210', role = 'farmer' } = req.body;
  const user = users.find((item) => item.phone === phone && item.role === role) || { id: `${role}-demo`, name: `Demo ${role}`, phone, role };
  res.json({ user, token: `demo-token-${user.id}` });
});
router.get('/me', (req, res) => res.json(users[0]));
export default router;
