import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "static.danbing.ai",
				pathname: "/**",
			},
		],
	},
	eslint: {
		// Allow production builds to successfully complete even if your project has ESLint errors.
		ignoreDuringBuilds: true,
	},
};

export default nextConfig;
