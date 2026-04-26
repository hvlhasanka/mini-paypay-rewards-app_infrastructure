import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) throw new Error('DATABASE_URL is not set');

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const USERS = [
  { email: 'lucas@test.com', name: 'Lucas Jackson', password: 'Testing2$' },
  { email: 'sam@test.com', name: 'Sam Jackson', password: 'Testing3$' },
  { email: 'william@test.com', name: 'William Jackson', password: 'Testing4$' },
];

const REWARDS = [
  {
    name: 'Pro Sound Headphones',
    description: 'Studio-quality audio with active noise cancellation for the ultimate focus.',
    pointsCost: 15000,
    stockRemaining: 12,
    isActive: true,
    category: 'lifestyle',
    imageUrl: 'https://raw.githubusercontent.com/hvlhasanka/mini-paypay-rewards-app_infrastructure/refs/heads/main/Workspace/mini-pay-pay-records_external-images/Rewards-1-pro-sound-headphones.png',
  },
  {
    name: 'Zen Spa Escape',
    description: 'A full-day immersive relaxation experience at our partner luxury retreats.',
    pointsCost: 8500,
    stockRemaining: 5,
    isActive: true,
    category: 'lifestyle',
    imageUrl: 'https://raw.githubusercontent.com/hvlhasanka/mini-paypay-rewards-app_infrastructure/refs/heads/main/Workspace/mini-pay-pay-records_external-images/Rewards-2-zen-spa-escape.png',
  },
  {
    name: 'First Class Upgrade',
    description: 'Upgrade any international flight to First Class suite with premium amenities.',
    pointsCost: 45000,
    stockRemaining: 2,
    isActive: true,
    category: 'travel',
    imageUrl: 'https://raw.githubusercontent.com/hvlhasanka/mini-paypay-rewards-app_infrastructure/refs/heads/main/Workspace/mini-pay-pay-records_external-images/Rewards-3-first-class-upgrade.png',
  },
  {
    name: 'Vanguard Timepiece',
    description: 'Limited edition automatic chronograph with sapphire crystal and leather strap.',
    pointsCost: 22000,
    stockRemaining: 1,
    isActive: true,
    category: 'lifestyle',
    imageUrl: 'https://raw.githubusercontent.com/hvlhasanka/mini-paypay-rewards-app_infrastructure/refs/heads/main/Workspace/mini-pay-pay-records_external-images/Rewards-4-vanguard-timepiece.png',
  },
  {
    name: 'Gourmet Box',
    description: 'A curated selection of artisanal delicacies delivered to your door.',
    pointsCost: 3200,
    stockRemaining: 13,
    isActive: true,
    category: 'lifestyle',
    imageUrl: 'https://raw.githubusercontent.com/hvlhasanka/mini-paypay-rewards-app_infrastructure/refs/heads/main/Workspace/mini-pay-pay-records_external-images/Rewards-5-gourment-box.png',
  },
  {
    name: 'Vault VR System',
    description: 'Experience the next generation of digital reality with our flagship VR hardware.',
    pointsCost: 28000,
    stockRemaining: 0,
    isActive: true,
    category: 'lifestyle',
    imageUrl: 'https://raw.githubusercontent.com/hvlhasanka/mini-paypay-rewards-app_infrastructure/refs/heads/main/Workspace/mini-pay-pay-records_external-images/Rewards-6-vault-box-system.png',
  },
];

interface LedgerTemplate {
  reason: string;
  category: string;
  source: string | null;
  earn: boolean;
  min: number;
  max: number;
}

const TEMPLATES: LedgerTemplate[] = [
  { reason: 'Luxury Boutique', category: 'purchase', source: 'Boutique Mall', earn: true, min: 200, max: 500 },
  { reason: 'Maison Bistro', category: 'dining', source: 'Restaurant', earn: true, min: 75, max: 250 },
  { reason: 'Bolt Rides', category: 'travel', source: 'Ride sharing', earn: true, min: 25, max: 80 },
  { reason: 'Referral Bonus', category: 'reward', source: 'Referral Program', earn: true, min: 500, max: 1500 },
  { reason: 'Cashback Reward', category: 'reward', source: 'Amazon Purchase', earn: true, min: 50, max: 250 },
  { reason: 'Interest Accrual', category: 'reward', source: 'Vault Savings', earn: true, min: 50, max: 200 },
  { reason: 'Coffee shop purchase', category: 'dining', source: 'Café', earn: true, min: 15, max: 60 },
  { reason: 'Transit top-up', category: 'travel', source: 'Transit Card', earn: true, min: 20, max: 100 },
  { reason: 'Online order', category: 'purchase', source: 'Online Retailer', earn: true, min: 80, max: 320 },
  { reason: 'Subscription renewal', category: 'purchase', source: 'Streaming Service', earn: true, min: 25, max: 75 },
  { reason: 'Global Airways', category: 'redemption', source: 'Travel Booking', earn: false, min: 1500, max: 3000 },
  { reason: 'Luxury Watch', category: 'redemption', source: 'Vault Marketplace', earn: false, min: 600, max: 1200 },
  { reason: 'Transfer to External', category: 'redemption', source: 'Chase Bank', earn: false, min: 1000, max: 2500 },
  { reason: 'Redeemed Coffee Voucher', category: 'redemption', source: 'Vault Marketplace', earn: false, min: 100, max: 250 },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const TARGET_BALANCE = 24850;
const MILESTONE_DELTA = 500;
const SIGNUP_BONUS_DELTA = 50;

function buildEntries(userId: string, seed: number) {
  const rand = seededRandom(seed);
  const entries: {
    userId: string;
    delta: number;
    reason: string;
    category: string;
    source: string | null;
    createdAt: Date;
  }[] = [];

  const randomCount = 23;
  const milestonePosition = 20;
  const now = Date.now();

  for (let i = 0; i < randomCount; i++) {
    const t = TEMPLATES[Math.floor(rand() * TEMPLATES.length)]!;
    const magnitude = Math.floor(rand() * (t.max - t.min)) + t.min;
    const daysAgo = i < milestonePosition - 1 ? i + 1 : i + 2;
    entries.push({
      userId,
      delta: t.earn ? magnitude : -magnitude,
      reason: t.reason,
      category: t.category,
      source: t.source,
      createdAt: new Date(now - daysAgo * 24 * 60 * 60 * 1000),
    });
  }

  entries.push({
    userId,
    delta: MILESTONE_DELTA,
    reason: 'Referral Platinum Bonus',
    category: 'reward',
    source: '5 users successfully onboarded',
    createdAt: new Date(now - milestonePosition * 24 * 60 * 60 * 1000),
  });

  entries.push({
    userId,
    delta: SIGNUP_BONUS_DELTA,
    reason: 'Signup Bonus',
    category: 'reward',
    source: 'Onboarding',
    createdAt: new Date(now - (randomCount + 2) * 24 * 60 * 60 * 1000),
  });

  const sumSoFar = entries.reduce((acc, e) => acc + e.delta, 0);
  const diff = TARGET_BALANCE - sumSoFar;
  entries[randomCount - 1]!.delta += diff;

  return entries;
}

async function main() {
  console.log('Clearing existing data...');
  await prisma.redemption.deleteMany();
  await prisma.pointLedger.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users...');
  const users = await Promise.all(
    USERS.map(async (u) =>
      prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          passwordHash: await bcrypt.hash(u.password, 12),
        },
      }),
    ),
  );

  console.log('Seeding rewards...');
  await prisma.reward.createMany({ data: REWARDS });

  console.log('Seeding ledger entries...');
  const allEntries = users.flatMap((u, idx) => buildEntries(u.id, idx + 1));
  await prisma.pointLedger.createMany({ data: allEntries });

  console.log(
    `Seed complete: ${users.length} users, ${REWARDS.length} rewards, ${allEntries.length} ledger entries.`,
  );
  console.log('Login credentials:');
  USERS.forEach((u) => console.log(`  ${u.email} / ${u.password}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
