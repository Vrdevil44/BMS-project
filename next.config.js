/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    basePath: '/BMS-project',
    assetPrefix: '/BMS-project/',
    images: {
        unoptimized: true,
    },
}

module.exports = nextConfig
