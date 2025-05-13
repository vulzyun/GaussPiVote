const dotenv = require('dotenv');

dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  reactStrictMode: true,
  env: {
    CONTRACTKEY: process.env.CONTRACTKEY,
  },
};

module.exports = nextConfig;