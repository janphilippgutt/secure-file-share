#!/bin/bash

set -e  # Exit on error
set -u  # Treat unset variables as errors

echo "Zipping Lambda function..."

# Navigate to lambda source and zip it
cd modules/lambda_function/lambda_src
zip -r ../lambda_payload.zip . > /dev/null
cd ../../..

echo "Lambda function zipped!"

echo "Deploying with Terraform..."
terraform apply -auto-approve

echo "Extracting Terraform outputs..."

# Read outputs
API_URL=$(terraform output -raw api_endpoint)
USER_POOL_ID=$(terraform output -raw user_pool_id)
CLIENT_ID=$(terraform output -raw user_pool_client_id)

echo "Writing config.json..."

# Generate config.json in project root
cat > ./config.json <<EOF
{
  "apiGatewayUrl": "$API_URL",
  "userPoolId": "$USER_POOL_ID",
  "userPoolClientId": "$CLIENT_ID"
}
EOF

echo "config.json generated!"
