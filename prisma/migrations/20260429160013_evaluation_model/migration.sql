-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "evaluatesAttitude" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "evaluationPassingGrade" DOUBLE PRECISION NOT NULL DEFAULT 4.0;

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "technicalScore" DOUBLE PRECISION,
    "knowledgeScore" DOUBLE PRECISION,
    "attitudeScore" DOUBLE PRECISION,
    "participationScore" DOUBLE PRECISION,
    "finalGrade" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "notes" TEXT,
    "evaluatedById" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_enrollmentId_key" ON "Evaluation"("enrollmentId");

-- CreateIndex
CREATE INDEX "Evaluation_evaluatedById_idx" ON "Evaluation"("evaluatedById");

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluatedById_fkey" FOREIGN KEY ("evaluatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
