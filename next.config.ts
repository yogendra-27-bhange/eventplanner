import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
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
  allowedDevOrigins: [
    'https://6000-firebase-studio-1748882722087.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev',
    'https://9000-firebase-studio-1748882722087.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev',
  ],
};

export default nextConfig;
