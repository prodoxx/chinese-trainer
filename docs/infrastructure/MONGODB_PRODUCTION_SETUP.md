# MongoDB Production Setup

## Overview

The application uses MongoDB for storing:
- Dictionary data (CC-CEDICT)
- Decks and cards
- Reviews and user progress
- Cached enrichment data

For production deployment on Railway, you need a MongoDB instance that's accessible from the cloud.

## Option 1: MongoDB Atlas (Recommended)

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (M0 free tier is sufficient for starting)

### 2. Configure Network Access
1. In Atlas, go to Network Access
2. Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
   - For production, consider restricting to Railway's IP ranges

### 3. Create Database User
1. Go to Database Access
2. Add New Database User
3. Set username and password
4. Grant "Read and write to any database" permission

### 4. Get Connection String
1. Go to your cluster → Connect
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. **IMPORTANT**: Replace `myFirstDatabase` or any database name with `danbing`

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/danbing?retryWrites=true&w=majority
```

**⚠️ Common Issue: Test Database**
If your collections are being created in a `test` database instead of `danbing`, it means:
- The database name is missing from your connection string
- The connection string has `/test` or just `/` after the hostname

The application now automatically ensures the correct database name (`danbing`) is used.

### 5. Add to Railway Environment Variables
1. In Railway dashboard, go to your service
2. Variables → Add Variable
3. Add: `MONGODB_URI` = your connection string

## Option 2: Deploy MongoDB on Railway

### 1. Add MongoDB Service
1. In Railway project → New Service
2. Choose Database → MongoDB
3. Deploy

### 2. Get Connection String
1. Click on the MongoDB service
2. Go to Variables tab
3. Copy `MONGO_URL`
4. Add to your app service as `MONGODB_URI`

**⚠️ Important for Production MongoDB:**
- Some providers (like Railway) don't support database names in the connection URL
- Use the connection string as provided by your hosting service
- The application will automatically select the `danbing` database after connecting in production
- Example Railway URL: `mongodb://user:pass@host.proxy.rlwy.net:12345` (no database name)
- Example Atlas URL: `mongodb+srv://user:pass@cluster.mongodb.net/` (can include database name)

## Loading Dictionary Data in Production

### Method 1: Load from Railway Shell (After MongoDB is Connected)
```bash
# SSH into Railway
railway shell

# Load dictionary
bun run load-dict
```

### Method 2: Load from Local Machine
```bash
# Set production MongoDB URI temporarily
export MONGODB_URI="your-production-mongodb-uri"

# Run locally
bun run load-dict
```

### Method 3: Create a One-Time Job
Add to `package.json`:
```json
"scripts": {
  "load-dict:prod": "MONGODB_URI=$MONGODB_PROD_URI bun run scripts/load-cedict.ts"
}
```

## Troubleshooting

### Authentication Failed
- Verify username and password are correct
- Check if user has proper permissions
- Ensure connection string is properly escaped

### Connection Timeout
- Check network access settings in Atlas
- Verify Railway can reach MongoDB (0.0.0.0/0 for testing)
- Check if connection string includes all required parameters

### Local vs Production
The application automatically uses:
- Local: `mongodb://localhost:27017/danbing`
- Production: Value from `MONGODB_URI` environment variable

**Note**: MongoDB automatically creates the `danbing` database when you first write data to it. You don't need to manually create the database.

## Environment Variables Summary

Add these to Railway:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/danbing?retryWrites=true&w=majority
```

## Data Migration

To migrate existing data from local to production:
```bash
# Export from local
mongodump --uri="mongodb://localhost:27017/danbing" --out=./backup

# Import to production
mongorestore --uri="your-production-mongodb-uri" ./backup/danbing
```

## Security Best Practices

1. **Use strong passwords** for database users
2. **Restrict network access** to known IPs when possible
3. **Enable authentication** on all MongoDB instances
4. **Use SSL/TLS** connections (default in Atlas)
5. **Regular backups** of production data
6. **Monitor database usage** and set alerts

## CC-CEDICT Data

The dictionary data file (`cedict_ts.u8`) should be:
1. Included in your repository under `/data/`
2. Or downloaded during build process
3. Loaded once after MongoDB is set up

The load process takes about 1-2 minutes for ~120,000 entries.