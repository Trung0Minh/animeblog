-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('PAGE_VIEW', 'POST_READ', 'COMMENT_SUBMITTED', 'NEWSLETTER_SUBSCRIBED', 'SEARCH_PERFORMED');

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "path" TEXT,
    "postSlug" TEXT,
    "searchQuery" TEXT,
    "visitorHash" TEXT,
    "sessionHash" TEXT,
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_daily_summaries" (
    "id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "pageviews" INTEGER NOT NULL DEFAULT 0,
    "visitors" INTEGER NOT NULL DEFAULT 0,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "reads" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "newsletterSignups" INTEGER NOT NULL DEFAULT 0,
    "searches" INTEGER NOT NULL DEFAULT 0,
    "totalReadSeconds" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_daily_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_daily_pages" (
    "id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "path" TEXT NOT NULL,
    "postSlug" TEXT,
    "pageviews" INTEGER NOT NULL DEFAULT 0,
    "reads" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_daily_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_daily_visitors" (
    "id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_daily_visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_daily_sessions" (
    "id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_daily_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_type_createdAt_idx" ON "analytics_events"("type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "analytics_events_path_createdAt_idx" ON "analytics_events"("path", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "analytics_events_postSlug_type_createdAt_idx" ON "analytics_events"("postSlug", "type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "analytics_events_visitorHash_createdAt_idx" ON "analytics_events"("visitorHash", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "analytics_daily_summaries_day_key" ON "analytics_daily_summaries"("day");

-- CreateIndex
CREATE INDEX "analytics_daily_summaries_day_idx" ON "analytics_daily_summaries"("day");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_daily_pages_day_path_key" ON "analytics_daily_pages"("day", "path");

-- CreateIndex
CREATE INDEX "analytics_daily_pages_path_day_idx" ON "analytics_daily_pages"("path", "day" DESC);

-- CreateIndex
CREATE INDEX "analytics_daily_pages_postSlug_day_idx" ON "analytics_daily_pages"("postSlug", "day" DESC);

-- CreateIndex
CREATE INDEX "analytics_daily_pages_day_pageviews_idx" ON "analytics_daily_pages"("day", "pageviews" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "analytics_daily_visitors_day_visitorHash_key" ON "analytics_daily_visitors"("day", "visitorHash");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_daily_sessions_day_sessionHash_key" ON "analytics_daily_sessions"("day", "sessionHash");
