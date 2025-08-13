-- CreateTable
CREATE TABLE "DailyEnrichmentUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enrichmentsToday" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyEnrichmentUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyEnrichmentUsage_userId_key" ON "DailyEnrichmentUsage"("userId");

-- AddForeignKey
ALTER TABLE "DailyEnrichmentUsage" ADD CONSTRAINT "DailyEnrichmentUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;