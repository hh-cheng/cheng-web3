import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  strictMode: false,
  env: { NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS },
}

export default nextConfig
