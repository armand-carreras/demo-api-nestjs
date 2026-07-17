-- AlterTable
ALTER TABLE "users" ADD COLUMN "reset_code" TEXT;
ALTER TABLE "users" ADD COLUMN "reset_code_expires_at" DATETIME;
