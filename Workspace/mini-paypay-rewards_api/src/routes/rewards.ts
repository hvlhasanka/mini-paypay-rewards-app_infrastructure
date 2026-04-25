import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const category = typeof req.query['category'] === 'string' ? req.query['category'] : undefined;

  const rewards = await prisma.reward.findMany({
    where: {
      isActive: true,
      stockRemaining: { gt: 0 },
      ...(category && category !== 'all' ? { category } : {}),
    },
    orderBy: { pointsCost: 'asc' },
  });
  res.json({ rewards });
});

router.post('/:id/redeem', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const rewardId = req.params['id'];

  const rawHeader = req.header('x-idempotency-key');
  const idempotencyKey = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  if (!idempotencyKey || idempotencyKey.length < 8) {
    res.status(400).json({ error: 'X-Idempotency-Key header is required' });
    return;
  }

  if (!rewardId) {
    res.status(400).json({ error: 'Reward id is required' });
    return;
  }

  // Idempotent: if a redemption with this key already exists, return it.
  const existing = await prisma.redemption.findUnique({
    where: { idempotencyKey },
    include: { reward: true },
  });
  if (existing) {
    if (existing.userId !== userId || existing.rewardId !== rewardId) {
      res.status(409).json({ error: 'Idempotency key already used for a different request' });
      return;
    }
    const balanceAgg = await prisma.pointLedger.aggregate({
      where: { userId },
      _sum: { delta: true },
    });
    res.json({ redemption: existing, balance: balanceAgg._sum.delta ?? 0 });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const reward = await tx.reward.findUnique({ where: { id: rewardId } });
      if (!reward || !reward.isActive) {
        throw Object.assign(new Error('REWARD_UNAVAILABLE'), { status: 404 });
      }

      const balanceAgg = await tx.pointLedger.aggregate({
        where: { userId },
        _sum: { delta: true },
      });
      const balance = balanceAgg._sum.delta ?? 0;
      if (balance < reward.pointsCost) {
        throw Object.assign(new Error('INSUFFICIENT_POINTS'), { status: 402 });
      }

      // Conditional decrement — fails if another transaction beat us to the last unit.
      const decRes = await tx.reward.updateMany({
        where: { id: rewardId, isActive: true, stockRemaining: { gt: 0 } },
        data: { stockRemaining: { decrement: 1 } },
      });
      if (decRes.count === 0) {
        throw Object.assign(new Error('OUT_OF_STOCK'), { status: 409 });
      }

      const redemption = await tx.redemption.create({
        data: {
          userId,
          rewardId,
          pointsCost: reward.pointsCost,
          idempotencyKey,
        },
        include: { reward: true },
      });

      await tx.pointLedger.create({
        data: {
          userId,
          delta: -reward.pointsCost,
          reason: `Redeemed ${reward.name}`,
          category: 'redemption',
          source: 'Vault Marketplace',
        },
      });

      return { redemption, balance: balance - reward.pointsCost };
    });

    res.status(201).json(result);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const code = err instanceof Error ? err.message : 'REDEEM_FAILED';
    const messages: Record<string, string> = {
      REWARD_UNAVAILABLE: 'Reward not found or no longer available',
      INSUFFICIENT_POINTS: 'You do not have enough points for this reward',
      OUT_OF_STOCK: 'This reward is now out of stock',
    };
    res.status(status).json({ error: messages[code] ?? 'Redemption failed' });
  }
});

export default router;
