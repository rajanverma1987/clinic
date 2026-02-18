/** @type {import('next').NextConfig} */
const path = require('path');
const {
  DOCUMENT_CACHE_CONTROL,
  PRAGMA,
  STATIC_IMMUTABLE_CACHE_CONTROL,
} = require('./lib/cache/http-cache-strategy.js');

const nextConfig = {
  reactStrictMode: process.env.NODE_ENV === 'production',
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
  webpack: (config, { isServer, dev, webpack }) => {
    // Ensure @/ alias resolves to app root (100% reliable for FormTransition, ImageTransition, etc.)
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
    };

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
        twilio: 'commonjs twilio',
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
  // CORS and CSP headers (CSP allows Next.js inline scripts; theme is in /theme-init.js to avoid inline)
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ');
    // Enterprise cache strategy: lib/cache/http-cache-strategy.js. Last matching source wins per header key.
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Pragma', value: PRAGMA },
          {
            key: 'Access-Control-Allow-Origin',
            value:
              process.env.CORS_ORIGINS ||
              (process.env.NODE_ENV === 'production'
                ? process.env.NEXT_PUBLIC_APP_URL || 'https://localhost'
                : 'http://localhost:5053, http://localhost:3000, http://127.0.0.1:5053, http://127.0.0.1:3000'),
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Cache-Control', value: DOCUMENT_CACHE_CONTROL },
        ],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: STATIC_IMMUTABLE_CACHE_CONTROL }],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: STATIC_IMMUTABLE_CACHE_CONTROL }],
      },
    ];
  },
  // Rewrites
  async rewrites() {
    return [
      {
        source: '/.well-known/appspecific/com.chrome.devtools.json',
        destination: '/api/well-known/chrome-devtools',
      },
    ];
  },
  // CDN Configuration
  assetPrefix: process.env.CDN_URL || '',
  // Generate static pages for better CDN caching
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
};

module.exports = nextConfig;
