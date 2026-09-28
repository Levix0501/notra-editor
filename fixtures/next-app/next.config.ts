import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Keep `next dev` from writing agent instruction files into the fixture.
  agentRules: false,
}

export default nextConfig
