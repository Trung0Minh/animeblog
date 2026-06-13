-- Improve authenticated dashboard and admin navigation queries.
CREATE INDEX "users_role_createdAt_idx" ON "users"("role", "createdAt" DESC);
CREATE INDEX "users_role_name_idx" ON "users"("role", "name");
CREATE INDEX "invites_status_expiresAt_createdAt_idx" ON "invites"("status", "expiresAt", "createdAt" DESC);
CREATE INDEX "posts_authorId_status_updatedAt_idx" ON "posts"("authorId", "status", "updatedAt" DESC);
CREATE INDEX "categories_parentId_name_idx" ON "categories"("parentId", "name");
CREATE INDEX "comments_status_createdAt_idx" ON "comments"("status", "createdAt" DESC);
