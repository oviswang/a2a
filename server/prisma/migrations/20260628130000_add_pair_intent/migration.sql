-- CreateTable
CREATE TABLE "PairIntent" (
    "id" TEXT NOT NULL,
    "fromVisitorId" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "toVisitorId" TEXT NOT NULL,
    "worldSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PairIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PairIntent_fromVisitorId_toVisitorId_key" ON "PairIntent"("fromVisitorId", "toVisitorId");

-- CreateIndex
CREATE INDEX "PairIntent_toVisitorId_createdAt_idx" ON "PairIntent"("toVisitorId", "createdAt" DESC);
