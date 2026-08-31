import type { Request, Response } from "express";
import { and, eq, inArray, lte } from "drizzle-orm";
import { platformJobs, stories, storyArchives, storyViews } from "../drizzle/schema";
import { sdk } from "./_core/sdk";
import { requireDb } from "./db";

const STORY_EXPIRY_JOB_ID = "story-expiry";

export async function cleanupExpiredStories(req: Request, res: Response) {
  try {
    const cronUser = await sdk.authenticateRequest(req);
    if (!cronUser.isCron || !cronUser.taskUid) return res.status(403).json({ error: "cron-only" });

    const db = await requireDb();
    const job = await db
      .select()
      .from(platformJobs)
      .where(and(eq(platformJobs.id, STORY_EXPIRY_JOB_ID), eq(platformJobs.scheduleCronTaskUid, cronUser.taskUid), eq(platformJobs.enabled, true)))
      .limit(1);
    if (!job[0]) return res.json({ ok: true, skipped: "unregistered-schedule" });

    const expired = await db.select().from(stories).where(lte(stories.expiresAt, new Date())).limit(500);
    const storyIds = expired.map(story => story.id);
    if (storyIds.length) {
      await db.transaction(async transaction => {
        for (const story of expired) {
          await transaction.insert(storyArchives).values({ id: `arch_${story.id}`, originalStoryId: story.id, ownerAccountId: story.authorAccountId, mediaId: story.mediaId, caption: story.caption, originalCreatedAt: story.createdAt, expiredAt: story.expiresAt }).onDuplicateKeyUpdate({ set: { archivedAt: new Date() } });
        }
        await transaction.delete(storyViews).where(inArray(storyViews.storyId, storyIds));
        await transaction.delete(stories).where(inArray(stories.id, storyIds));
      });
    }
    await db.update(platformJobs).set({ lastCompletedAt: new Date(), lastError: null }).where(eq(platformJobs.id, STORY_EXPIRY_JOB_ID));
    return res.json({ ok: true, removedStories: storyIds.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected story cleanup failure.";
    console.error("[Story cleanup]", error);
    return res.status(500).json({ error: message, timestamp: new Date().toISOString(), context: { path: "/api/scheduled/story-expiry" } });
  }
}
