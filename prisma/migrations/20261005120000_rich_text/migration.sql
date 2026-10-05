-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "body_doc" JSONB;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "description_doc" JSONB;
