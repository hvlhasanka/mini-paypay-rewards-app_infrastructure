import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const pushTokenSchema = z.object({
  pushToken: z.string().min(1).max(200).nullable(),
});

router.post('/me/push-token', requireAuth, async (req: Request, res: Response) => {
  const parsed = pushTokenSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid push token' });
    return;
  }
  await prisma.user.update({
    where: { id: req.user!.sub },
    data: { pushToken: parsed.data.pushToken },
  });
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const [user, balanceAgg] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, pushToken: true, createdAt: true },
    }),
    prisma.pointLedger.aggregate({
      where: { userId },
      _sum: { delta: true },
    }),
  ]);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user, balance: balanceAgg._sum.delta ?? 0 });
});

router.get('/me/transactions', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const page = Math.max(parseInt(String(req.query['page'] ?? '1'), 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(String(req.query['limit'] ?? '20'), 10) || 20, 1),
    50,
  );

  const [total, entries] = await Promise.all([
    prisma.pointLedger.count({ where: { userId } }),
    prisma.pointLedger.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({
    transactions: entries,
    page,
    limit,
    total,
    hasMore: page * limit < total,
  });
});

router.get('/me/redemptions', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const page = Math.max(parseInt(String(req.query['page'] ?? '1'), 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(String(req.query['limit'] ?? '20'), 10) || 20, 1),
    50,
  );

  const [total, redemptions] = await Promise.all([
    prisma.redemption.count({ where: { userId } }),
    prisma.redemption.findMany({
      where: { userId },
      include: {
        reward: {
          select: { id: true, name: true, description: true, imageUrl: true, category: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({
    redemptions,
    page,
    limit,
    total,
    hasMore: page * limit < total,
  });
});

export default router;
