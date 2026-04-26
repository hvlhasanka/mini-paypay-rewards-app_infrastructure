import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { redeemReward, RedemptionError } from '../redemption.js';

interface Reward {
  id: string;
  name: string;
  pointsCost: number;
  isActive: boolean;
  stockRemaining: number;
}

interface ExistingRedemption {
  id: string;
  userId: string;
  rewardId: string;
  pointsCost: number;
  idempotencyKey: string;
  createdAt: Date;
  reward: Reward;
}

function buildReward(overrides: Partial<Reward> = {}): Reward {
  return {
    id: 'reward-1',
    name: 'Coffee Voucher',
    pointsCost: 150,
    isActive: true,
    stockRemaining: 5,
    ...overrides,
  };
}

function buildPrismaMock({
  existing = null,
  rewardRow,
  outerBalance,
  innerBalance,
  decrementCount = 1,
}: {
  existing?: ExistingRedemption | null;
  rewardRow: Reward | null;
  outerBalance?: number;
  innerBalance: number;
  decrementCount?: number;
}) {
  const txMocks = {
    reward: {
      findUnique: jest.fn(async () => rewardRow),
      updateMany: jest.fn(async () => ({ count: decrementCount })),
    },
    pointLedger: {
      aggregate: jest.fn(async () => ({ _sum: { delta: innerBalance } })),
      create: jest.fn(async () => ({})),
    },
    redemption: {
      create: jest.fn(async (args: { data: { userId: string; rewardId: string; pointsCost: number; idempotencyKey: string } }) => ({
        id: 'redemption-new',
        ...args.data,
        createdAt: new Date(),
        reward: rewardRow ?? buildReward(),
      })),
    },
  };

  const prismaMock = {
    redemption: {
      findUnique: jest.fn(async () => existing),
    },
    pointLedger: {
      aggregate: jest.fn(async () => ({
        _sum: { delta: outerBalance ?? innerBalance },
      })),
    },
    reward: txMocks.reward,
    $transaction: jest.fn(
      async (cb: (tx: typeof txMocks) => Promise<unknown>) => cb(txMocks),
    ),
  };

  return { prismaMock, txMocks };
}

describe('redeemReward', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redeems successfully and writes a matching ledger entry', async () => {
    const reward = buildReward({ pointsCost: 150 });
    const { prismaMock, txMocks } = buildPrismaMock({
      rewardRow: reward,
      innerBalance: 500,
    });

    const result = await redeemReward(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaMock as any,
      { userId: 'user-1', rewardId: reward.id, idempotencyKey: 'idem-aaaa1111' },
    );

    expect(result.alreadyExisted).toBe(false);
    expect(result.balance).toBe(500 - reward.pointsCost);
    expect(result.redemption.idempotencyKey).toBe('idem-aaaa1111');
    expect(result.redemption.pointsCost).toBe(reward.pointsCost);

    expect(txMocks.reward.updateMany).toHaveBeenCalledWith({
      where: { id: reward.id, isActive: true, stockRemaining: { gt: 0 } },
      data: { stockRemaining: { decrement: 1 } },
    });
    expect(txMocks.pointLedger.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        delta: -reward.pointsCost,
        reason: reward.name,
        category: 'redemption',
        source: 'Vault Marketplace',
      },
    });
  });

  it('throws INSUFFICIENT_POINTS when balance is below the cost', async () => {
    const reward = buildReward({ pointsCost: 1000 });
    const { prismaMock, txMocks } = buildPrismaMock({
      rewardRow: reward,
      innerBalance: 200,
    });

    await expect(
      redeemReward(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        prismaMock as any,
        { userId: 'user-1', rewardId: reward.id, idempotencyKey: 'idem-bbbb2222' },
      ),
    ).rejects.toMatchObject<Partial<RedemptionError>>({
      code: 'INSUFFICIENT_POINTS',
      status: 402,
    });

    // Did NOT decrement stock or write a ledger entry.
    expect(txMocks.reward.updateMany).not.toHaveBeenCalled();
    expect(txMocks.redemption.create).not.toHaveBeenCalled();
    expect(txMocks.pointLedger.create).not.toHaveBeenCalled();
  });

  it('returns the existing redemption when the idempotency key was already used by the same user/reward', async () => {
    const reward = buildReward({ pointsCost: 150 });
    const existing: ExistingRedemption = {
      id: 'redemption-old',
      userId: 'user-1',
      rewardId: reward.id,
      pointsCost: reward.pointsCost,
      idempotencyKey: 'idem-cccc3333',
      createdAt: new Date('2026-04-01T10:00:00Z'),
      reward,
    };

    const { prismaMock, txMocks } = buildPrismaMock({
      existing,
      rewardRow: reward,
      outerBalance: 350,
      innerBalance: 350,
    });

    const result = await redeemReward(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaMock as any,
      { userId: 'user-1', rewardId: reward.id, idempotencyKey: 'idem-cccc3333' },
    );

    expect(result.alreadyExisted).toBe(true);
    expect(result.redemption.id).toBe('redemption-old');
    expect(result.balance).toBe(350);

    // The transaction must NOT run a second time.
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(txMocks.redemption.create).not.toHaveBeenCalled();
    expect(txMocks.pointLedger.create).not.toHaveBeenCalled();
    expect(txMocks.reward.updateMany).not.toHaveBeenCalled();
  });

  it('throws IDEMPOTENCY_CONFLICT when the same key was used by a different user/reward', async () => {
    const reward = buildReward();
    const existing: ExistingRedemption = {
      id: 'redemption-other',
      userId: 'someone-else',
      rewardId: 'other-reward',
      pointsCost: 999,
      idempotencyKey: 'idem-dddd4444',
      createdAt: new Date(),
      reward: buildReward({ id: 'other-reward', name: 'Other' }),
    };

    const { prismaMock } = buildPrismaMock({
      existing,
      rewardRow: reward,
      innerBalance: 1000,
    });

    await expect(
      redeemReward(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        prismaMock as any,
        { userId: 'user-1', rewardId: reward.id, idempotencyKey: 'idem-dddd4444' },
      ),
    ).rejects.toMatchObject<Partial<RedemptionError>>({
      code: 'IDEMPOTENCY_CONFLICT',
      status: 409,
    });
  });
});
