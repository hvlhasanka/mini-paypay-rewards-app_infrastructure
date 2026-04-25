import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const category = typeof req.query['category'] === 'string' ? req.query['category'] : undefined;

  const rewards = await prisma.reward.findMany({
    where: {
      isActive: true,
      ...(category && category !== 'all' ? { category } : {}),
    },
    orderBy: { pointsCost: 'asc' },
  });
  res.json({ rewards });
});

export default router;
