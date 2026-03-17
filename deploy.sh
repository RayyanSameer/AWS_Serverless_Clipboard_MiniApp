#!/bin/bash
set -e

echo "Getting outputs from Terraform..."
API_URL=$(cd src/infrastructure && terraform output -raw api_endpoint)
CF_ID=$(cd src/infrastructure && terraform output -raw cloudfront_distribution_id)
BUCKET="clipshare-frontend-rayyan"

echo "API URL: $API_URL"

echo "Building frontend..."
cd src/frontend
VITE_API_URL=$API_URL npm run build

echo "Syncing to S3..."
aws s3 sync dist/ s3://$BUCKET --delete

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CF_ID --paths "/*"

echo ""
echo "Done. Live at:"
cd ../infrastructure && terraform output -raw cloudfront_url
