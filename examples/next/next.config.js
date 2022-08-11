/** @type {import('next').NextConfig} */
const withLinaria = require('@linaria/next')

const nextConfig = withLinaria({
  reactStrictMode: true,
  swcMinify: true,
})

module.exports = nextConfig
