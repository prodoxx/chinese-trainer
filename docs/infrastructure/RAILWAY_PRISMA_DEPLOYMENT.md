# Railway Prisma Deployment

## Issue: OpenSSL Library Error

When deploying to Railway, you might encounter this error:
```
Unable to require(`/app/src/generated/prisma/libquery_engine-debian-openssl-3.0.x.so.node`).
Prisma cannot find the required `libssl` system library in your system. Please install openssl-3.0.x and try again.
Details: libssl.so.3: cannot open shared object file: No such file or directory
```

This happens because:
1. Railway uses a Debian-based container
2. Prisma needs OpenSSL 3.0.x libraries
3. The Prisma binary needs to match the deployment environment

## Solution

### 1. Nixpacks Configuration
The `nixpacks.toml` file includes:
- OpenSSL in nixPkgs
- libssl-dev in aptPkgs
- No custom PRISMA_QUERY_ENGINE_LIBRARY (let Prisma auto-detect)

### 2. Prisma Schema Binary Targets
The `prisma/schema.prisma` includes:
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
  binaryTargets = ["native", "linux-musl", "linux-musl-openssl-3.0.x", "debian-openssl-3.0.x"]
}
```

**Note**: We include multiple Linux targets to ensure compatibility. Prisma will automatically select the correct one at runtime.

### 3. Build Process
The build process:
1. Installs OpenSSL dependencies
2. Generates Prisma client with correct binaries
3. Builds the Next.js application

### 4. Postinstall Script
The `package.json` includes:
```json
"postinstall": "prisma generate"
```
This ensures Prisma generates after dependencies are installed.

## Environment Variables

Make sure these are set in Railway:
- `DATABASE_URL` - PostgreSQL connection string
- `MONGODB_URI` - MongoDB connection string (without database name)
- All other required environment variables

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Fix Prisma OpenSSL dependencies for Railway"
   git push
   ```

2. **Railway will automatically**:
   - Install dependencies including OpenSSL
   - Generate Prisma client with correct binaries
   - Build and deploy the application

## Troubleshooting

### If the error persists:

1. **Check Railway logs** for the exact error
2. **Verify environment variables** are set correctly
3. **Clear Railway build cache** (Settings → Clear Build Cache)
4. **Redeploy** the application

### Alternative Solutions:

If the issue continues, you can try:

1. **Use Docker deployment** with a custom Dockerfile
2. **Switch to a different Prisma binary**:
   ```prisma
   binaryTargets = ["linux-musl", "linux-musl-openssl-3.0.x"]
   ```

## Related Files

- `/nixpacks.toml` - Nixpacks configuration
- `/prisma/schema.prisma` - Prisma schema with binary targets
- `/.npmrc` - NPM configuration for Prisma binaries
- `/package.json` - Postinstall script

## References

- [Prisma Binary Targets](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#binarytargets)
- [Railway Nixpacks](https://nixpacks.com/docs/configuration/file)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment/deployment)