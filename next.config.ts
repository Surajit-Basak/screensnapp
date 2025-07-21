import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // This is still good practice to have, even if it wasn't solving the issue alone.
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'display-capture=*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
