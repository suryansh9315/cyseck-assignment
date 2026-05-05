#!/bin/sh
set -e

echo "Pushing schema..."
npx prisma db push

echo "Seeding database..."
npx prisma db seed

echo "Starting app..."
exec npm start
