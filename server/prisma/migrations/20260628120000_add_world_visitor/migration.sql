-- CreateTable
CREATE TABLE "WorldVisitor" (
    "id" TEXT NOT NULL,
    "worldSlug" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "vehicle" TEXT NOT NULL DEFAULT 'plane',
    "companionName" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorldVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorldVisitor_worldSlug_visitorId_key" ON "WorldVisitor"("worldSlug", "visitorId");

-- CreateIndex
CREATE INDEX "WorldVisitor_worldSlug_lastSeenAt_idx" ON "WorldVisitor"("worldSlug", "lastSeenAt" DESC);
