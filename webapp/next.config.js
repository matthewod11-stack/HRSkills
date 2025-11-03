/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    RIPPLING_API_KEY: process.env.RIPPLING_API_KEY,
    NOTION_TOKEN: process.env.NOTION_TOKEN,
  }
}

module.exports = nextConfig
