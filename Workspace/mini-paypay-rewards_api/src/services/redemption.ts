import type { PrismaClient } from '../../generated/prisma/client.js';

export type RedemptionErrorCode =
  | 'REWARD_UNAVAILABLE'
  | 'INSUFFICIENT_POINTS'
  | 'OUT_OF_STOCK'
  | 'IDEMPOTENCY_CONFLICT';

export class RedemptionError extends Error {
  constructor(
    public readonly code: RedemptionErrorCode,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'RedemptionError';
  }
}

export interface RedeemInput {
  userId: string;
  rewardId: string;
  idempotencyKey: string;
}

interface RedemptionRecord {
  id: string;
  userId: string;
  rewardId: string;
  pointsCost: number;
  idempotencyKey: string;
  createdAt: Date;
  reward: {
    id: string;
    name: string;
    pointsCost: number;
  };
}

export interface RedeemResult {
  redemption: RedemptionRecord;
  balance: number;
  alreadyExisted: boolean;
}

type RedemptionPrisma = Pick<
  PrismaClient,
  'redemption' | 'pointLedger' | 'reward' | '$transaction'
>;

export async function redeemReward(
  prisma: RedemptionPrisma,
  { userId, rewardId, idempotencyKey }: RedeemInput,
): Promise<RedeemResult> {
  const existing = await prisma.redemption.findUnique({
    where: { idempotencyKey },
    include: { reward: true },
  });
  if (existing) {
    if (existing.userId !== userId || existing.rewardId !== rewardId) {
      throw new RedemptionError(
        'IDEMPOTENCY_CONFLICT',
        409,
        'Idempotency key already used for a different request',
      );
    }
    const balanceAgg = await prisma.pointLedger.aggregate({
      where: { userId },
      _sum: { delta: true },
    });
    return {
      redemption: existing as RedemptionRecord,
      balance: balanceAgg._sum.delta ?? 0,
      alreadyExisted: true,
    };
  }

  const txResult = await prisma.$transaction(async (tx) => {
    const reward = await tx.reward.findUnique({ where: { id: rewardId } });
    if (!reward || !reward.isActive) {
      throw new RedemptionError(
        'REWARD_UNAVAILABLE',
        404,
        'Reward not found or no longer available',
      );
    }

    const balanceAgg = await tx.pointLedger.aggregate({
      where: { userId },
      _sum: { delta: true },
    });
    const balance = balanceAgg._sum.delta ?? 0;
    if (balance < reward.pointsCost) {
      throw new RedemptionError(
        'INSUFFICIENT_POINTS',
        402,
        'You do not have enough points for this reward',
      );
    }

    const decRes = await tx.reward.updateMany({
      where: { id: rewardId, isActive: true, stockRemaining: { gt: 0 } },
      data: { stockRemaining: { decrement: 1 } },
    });
    if (decRes.count === 0) {
      throw new RedemptionError(
        'OUT_OF_STOCK',
        409,
        'This reward is now out of stock',
      );
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
        reason: reward.name,
        category: 'redemption',
        source: 'Vault Marketplace',
      },
    });

    return {
      redemption: redemption as RedemptionRecord,
      balance: balance - reward.pointsCost,
    };
  });

  return { ...txResult, alreadyExisted: false };
}
