/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Explicitly disable Babel to use SWC
  // Babel config is only for Jest tests (located in .jest/babel.config.js)
  experimental: {
    // Ensure SWC is used instead of Babel
  },
  // Disable Babel completely - use SWC only
  swcMinify: true,
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // Explicitly tell Next.js not to use Babel
  transpilePackages: [],
  // Enable compression
  compress: true,
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Modern remote patterns configuration
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
    ],
  },
  // Enable SWC minification (faster than Terser)
  swcMinify: true,
  // Optimize fonts
  optimizeFonts: true,
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer, dev, webpack }) => {
    // Explicitly prevent Next.js from using Babel - force SWC only
    // Remove any babel-loader configurations
    if (config.module && config.module.rules) {
      config.module.rules = config.module.rules.map((rule) => {
        if (rule.oneOf) {
          rule.oneOf = rule.oneOf.filter((oneOfRule) => {
            if (oneOfRule.use && Array.isArray(oneOfRule.use)) {
              return !oneOfRule.use.some((use) => {
                return (
                  (typeof use === 'string' && use.includes('babel')) ||
                  (typeof use === 'object' && use.loader && use.loader.includes('babel'))
                );
              });
            }
            return true;
          });
        }
        return rule;
      });
    }

    // Fix for simple-peer in Next.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Make twilio and sentry optional (external) to prevent build errors if not installed
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        'twilio': 'commonjs twilio',
        '@sentry/nextjs': 'commonjs @sentry/nextjs',
      });
    }

    // Production optimizations (client-only to avoid breaking server chunk loading)
    if (!dev && !isServer) {
      // Enable tree shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };

      // Split chunks for better caching (client bundle only)
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          heavy: {
            name: 'heavy',
            test: /[\\/]node_modules[\\/](html2canvas|jspdf|simple-peer|socket\.io)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
        },
      };
    }

    return config;
  },
  // CORS headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value:
              'http://localhost:5053, http://192.168.1.16:5053, http://localhost:8000, http://192.168.1.16:8000, https://localhost:8443, https://192.168.1.16:8443',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          // Do NOT set long cache here – it was causing HTML/CSS to require two hard refreshes.
          // Long cache only on true static assets (/_next/static, /images) below.
        ],
      },
      {
        source: '/images/:path*',
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
  // Rewrites
  async rewrites() {
    return [];
  },
  // CDN Configuration
  assetPrefix: process.env.CDN_URL || '',
  // Generate static pages for better CDN caching
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
};

module.exports = nextConfig;
