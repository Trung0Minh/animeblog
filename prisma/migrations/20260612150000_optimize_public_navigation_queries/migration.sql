-- Add indexes for cached public listing pages and author/tag lookups.
CREATE INDEX "posts_categoryId_status_publishedAt_updatedAt_idx"
  ON "posts"("categoryId", "status", "publishedAt" DESC, "updatedAt" DESC);

CREATE INDEX "posts_authorId_status_publishedAt_updatedAt_idx"
  ON "posts"("authorId", "status", "publishedAt" DESC, "updatedAt" DESC);

CREATE INDEX "post_authors_userId_idx"
  ON "post_authors"("userId");

CREATE INDEX "post_tags_tagId_idx"
  ON "post_tags"("tagId");
