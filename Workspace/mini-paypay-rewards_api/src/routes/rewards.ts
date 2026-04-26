import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendExpoPush } from '../lib/pushNotifications.js';
import { requireAuth } from '../middleware/auth.js';
import { redeemReward, RedemptionError } from '../services/redemption.js';

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

  try {
    const result = await redeemReward(prisma, { userId, rewardId, idempotencyKey });

    if (!result.alreadyExisted) {
      void prisma.user
        .findUnique({ where: { id: userId }, select: { pushToken: true } })
        .then((user) => {
          if (!user?.pushToken) return;
          return sendExpoPush({
            to: user.pushToken,
            title: 'Redemption confirmed',
            body: `${result.redemption.reward.name} redeemed. ${result.redemption.pointsCost.toLocaleString('en-US')} pts deducted from your balance.`,
            data: {
              kind: 'redemption',
              rewardId: result.redemption.rewardId,
              redemptionId: result.redemption.id,
            },
          });
        });
    }

    res
      .status(result.alreadyExisted ? 200 : 201)
      .json({ redemption: result.redemption, balance: result.balance });
  } catch (err) {
    if (err instanceof RedemptionError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Redemption failed' });
  }
});

export default router;
