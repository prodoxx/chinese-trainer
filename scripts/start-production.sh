#!/bin/sh

echo "Running database migrations..."
bunx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "Migration failed! Exiting..."
  exit 1
fi

echo "Starting Next.js application..."
bun run start