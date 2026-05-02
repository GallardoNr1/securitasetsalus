-- AlterEnum
ALTER TYPE "EnrollmentStatus" ADD VALUE 'PENDING_SENCE_APPROVAL';

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "senceRejectionReason" TEXT;
