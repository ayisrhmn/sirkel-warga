-- AlterTable
ALTER TABLE "datasets" ADD COLUMN     "fills" JSONB NOT NULL DEFAULT '[]';
