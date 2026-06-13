/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // avoid double socket connect / R3F double-mount in dev
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
