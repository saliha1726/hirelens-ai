/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Uploaded files are streamed through API routes; keep the default body-size
  // guard explicit so misconfigured deployments fail loudly, not silently.
  experimental: {},
};

export default nextConfig;
