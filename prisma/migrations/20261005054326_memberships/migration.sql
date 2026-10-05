-- CreateEnum
CREATE TYPE "membership_role" AS ENUM ('owner', 'admin');

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "community_id" UUID NOT NULL,
    "role" "membership_role" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memberships_community_id_idx" ON "memberships"("community_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_user_id_community_id_key" ON "memberships"("user_id", "community_id");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One owner (super admin) per community, and one owned community per user.
CREATE UNIQUE INDEX "memberships_one_owner_per_community" ON "memberships"("community_id") WHERE "role" = 'owner';
CREATE UNIQUE INDEX "memberships_one_owned_community_per_user" ON "memberships"("user_id") WHERE "role" = 'owner';
