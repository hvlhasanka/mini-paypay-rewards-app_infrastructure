-- Create users Table
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "push_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create rewards Table
CREATE TABLE "rewards" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT,
    "points_cost" INTEGER NOT NULL,
    "stock_remaining" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- Create point_ledger Table
CREATE TABLE "point_ledger" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_ledger_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "point_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create redemptions Table
CREATE TABLE "redemptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reward_id" UUID NOT NULL,
    "points_cost" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotency_key" TEXT NOT NULL,

    CONSTRAINT "redemptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "redemptions_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create users.email Index
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Create point_ledger.user_id Index
CREATE INDEX "point_ledger_user_id_idx" ON "point_ledger"("user_id");

-- Create redemptions.idempotency_key Index
CREATE UNIQUE INDEX "redemptions_idempotency_key_key" ON "redemptions"("idempotency_key");

-- Create redemptions.user_id Index
CREATE INDEX "redemptions_user_id_idx" ON "redemptions"("user_id");

-- Create redemptions.reward_id Index
CREATE INDEX "redemptions_reward_id_idx" ON "redemptions"("reward_id");
