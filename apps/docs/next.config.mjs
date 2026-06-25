// SPDX-License-Identifier: Apache-2.0
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@docforge/core',
    '@docforge/schema',
    '@docforge/provenance',
    '@docforge/adapter-fumadocs',
  ],
};

export default nextConfig;
