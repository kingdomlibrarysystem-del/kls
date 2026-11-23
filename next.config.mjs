/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  // Site search reads Word files on the server with mammoth (a plain Node package, not bundled).
  // pdf.js is NOT listed: the PDF reader page imports its worker too, and an external pdf.js breaks that page.
  serverExternalPackages: ['mammoth'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
}

export default nextConfig
