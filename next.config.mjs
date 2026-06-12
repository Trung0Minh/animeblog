/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Supabase pooler URLs in this project are configured with a very small
    // connection limit. Keep static generation serial so prerendered post pages
    // do not exhaust the database pool during `next build`.
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1000,
  },
};

export default nextConfig;
