#!/bin/bash

set -e  # Exit on error
set -u  # Treat unset variables as errors

echo "=== Secure File Share Deployment ==="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Default to INSTANCE mode
MODE="instance"
INSTANCE_NAME=""

if [[ $# -gt 0 ]]; then
  if [[ "$1" == "shared" ]]; then
    MODE="shared"
    echo "Mode: SHARED"
  else
    INSTANCE_NAME="$1"
    echo "Mode: INSTANCE"
    echo "Instance name: $INSTANCE_NAME"
  fi
else
  echo "Usage: $0 <instance-name>|shared"
  exit 1
fi

# Set working directory
if [[ "$MODE" == "shared" ]]; then
  WORKDIR="root-shared"
else
  WORKDIR="root-instance-$INSTANCE_NAME"
  mkdir -p "$WORKDIR"
fi

cd "$WORKDIR"

echo "Zipping Lambda function..."
cd ../modules/lambda_function/lambda_src
zip -r ../lambda_payload.zip . > /dev/null
cd ../../..

echo "Lambda function zipped!"

echo "Deploying with Terraform..."
terraform init -input=false
terraform apply -auto-approve

echo "Extracting Terraform outputs..."
API_URL=$(terraform output -raw api_endpoint)
USER_POOL_ID=$(terraform output -raw user_pool_id)
CLIENT_ID=$(terraform output -raw user_pool_client_id)

# Ensure frontend folder exists
FRONTEND_PATH="$ROOT_DIR/$WORKDIR/frontend"
if [[ ! -d "$FRONTEND_PATH" ]]; then
  echo "Copying frontend template..."
  mkdir -p "$FRONTEND_PATH"
  cp -r "$ROOT_DIR/frontend-template/." "$FRONTEND_PATH/"
fi

echo "Writing config.json..."
cat > "$FRONTEND_PATH/config.json" <<EOF
{
  "apiGatewayUrl": "$API_URL",
  "userPoolId": "$USER_POOL_ID",
  "userPoolClientId": "$CLIENT_ID"
}
EOF

echo "config.json generated at $FRONTEND_PATH/config.json"
echo "=== Deployment complete! ==="
