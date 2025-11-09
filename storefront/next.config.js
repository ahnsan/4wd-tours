/** @type {import('next').NextConfig} */

// Bundle analyzer configuration (optional)
// To use: npm install --save-dev @next/bundle-analyzer
// Then: ANALYZE=true npm run build
let withBundleAnalyzer = (config) => config;
try {
  if (process.env.ANALYZE === 'true') {
    withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
      openAnalyzer: true,
    });
  }
} catch (e) {
  // @next/bundle-analyzer not installed, skip
  console.log('Bundle analyzer not installed. Install with: npm install --save-dev @next/bundle-analyzer');
}

const nextConfig = {
  // Enable React strict mode for better error detection
  reactStrictMode: true,

  // Enable SWC minification for faster builds and smaller bundles
  swcMinify: true,

  // Enable compression
  compress: true,

  // Remove X-Powered-By header for security
  poweredByHeader: false,

  // Image optimization configuration
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Enable module concatenation
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },

  // Experimental features for better performance
  experimental: {
    // Optimize CSS - DISABLED: Requires 'critters' package
    // TODO: Install critters package: npm install critters
    // optimizeCss: true,
    // Optimize package imports
    optimizePackageImports: ['react', 'react-dom'],
  },

  // Build output configuration
  output: 'standalone',

  // Enable static optimization
  generateEtags: true,

  // Configure headers for better caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

}

module.exports = withBundleAnalyzer(nextConfig)
