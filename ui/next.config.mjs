// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // Privy v3 optional dependencies that we don't use directly.
      // These cannot be installed due to @solana/kit version conflicts
      // in the dependency tree (wagmi pins 5.x, these packages need 6.x).
      // Aliasing to false prevents webpack from throwing module-not-found
      // errors. Privy's signAndSendTransaction works without them.
      config.resolve.alias = {
        ...config.resolve.alias,
        "@stripe/crypto": false,
        "@farcaster/mini-app-solana": false,
        "@solana/wallet-adapter-react": false,
        "@solana-program/memo": false,
        "@solana-program/system": false,
        "@solana-program/token": false,
      };
    }
    return config;
  },
};

export default nextConfig;