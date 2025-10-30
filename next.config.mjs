/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    runtimeEnv: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ADZUNA_APP_ID: process.env.ADZUNA_APP_ID,
      ADZUNA_APP_KEY: process.env.ADZUNA_APP_KEY,
      ADZUNA_API_KEY: process.env.ADZUNA_API_KEY,
      RAPIDAPI_KEY: process.env.RAPIDAPI_KEY,
      RAPIDAPI_HOST: process.env.RAPIDAPI_HOST,
      ENABLE_ADZUNA: process.env.ENABLE_ADZUNA,
      ENABLE_RAPIDAPI: process.env.ENABLE_RAPIDAPI,
    },
  },
}

export default nextConfig
