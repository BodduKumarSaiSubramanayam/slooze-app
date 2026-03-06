/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@apollo/client', 'ts-invariant', 'zen-observable-ts'],
    webpack: (config) => {
        config.resolve.extensionAlias = {
            ".js": [".ts", ".tsx", ".js", ".jsx"],
            ".mjs": [".mts", ".mjs"],
            ".cjs": [".cts", ".cjs"],
        };
        return config;
    },
};

module.exports = nextConfig;
