#!/bin/bash

set -e  # Exit on error
set -u  # Treat unset variables as errors

echo "=== Secure File Share Deployment ==="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# --- Determine mode ---
MODE=""
INSTANCE_NAME=""

if [[ $# -gt 0 && "$1" == "shared" ]]; then
    MODE="shared"
    echo "Mode: SHARED"
else
    MODE="instance"
    echo "Mode: INSTANCE"

    # Prompt for instance name
    if [[ $# -gt 0 ]]; then
        INSTANCE_NAME="$1"
    else
        read -rp "Enter a unique instance name: " INSTANCE_NAME
        if [[ -z "$INSTANCE_NAME" ]]; then
            echo "Instance name cannot be empty."
            exit 1
        fi
    fi
    echo "Instance name: $INSTANCE_NAME"

    # --- Interactive prompts for variables ---
    # Prompt for base_name with validation
    while true; do
      read -p "Enter base_name for instance resources (lowercase letters, numbers, hyphens only): " BASE_NAME
      if [[ "$BASE_NAME" =~ ^[a-z0-9-]+$ ]]; then
        echo "✅ base_name accepted: $BASE_NAME"
        break
      else
        echo "❌ Invalid base_name. Please use only lowercase letters, numbers, and hyphens."
      fi
    done

    read -rp "Enter project name (default: secure-file-share): " PROJECT_NAME
    PROJECT_NAME="${PROJECT_NAME:-secure-file-share}"

    read -rp "Enter AWS region (default: eu-central-1): " AWS_REGION
    AWS_REGION="${AWS_REGION:-eu-central-1}"

    echo "Configuration:"
    echo "  Base Name : $BASE_NAME"
    echo "  Project   : $PROJECT_NAME"
    echo "  AWS Region: $AWS_REGION"
fi

# --- Prepare Lambda function ---
echo "Zipping Lambda function..."
cd "$ROOT_DIR/modules/lambda_function/lambda_src"
zip -r ../lambda_payload.zip . > /dev/null
cd "$ROOT_DIR"
echo "Lambda function zipped!"

# --- Prepare Terraform folder ---
if [[ "$MODE" == "instance" ]]; then
    INSTANCE_DIR="$ROOT_DIR/root-instance-$INSTANCE_NAME"
    echo "Creating instance directory: $INSTANCE_DIR"
    mkdir -p "$INSTANCE_DIR"

    # Copy Terraform configs for the instance
    cp -r "$ROOT_DIR/root-instance/"* "$INSTANCE_DIR/"

    # Copy frontend template
    cp -r "$ROOT_DIR/frontend-template/"* "$INSTANCE_DIR/"

    cd "$INSTANCE_DIR"

    # Create terraform.tfvars for instance-specific variables
    cat > terraform.tfvars <<EOF
aws_region      = "$AWS_REGION"
project         = "$PROJECT_NAME"
base_name       = "$BASE_NAME"
EOF

else
    # Shared deployment
    cd "$ROOT_DIR/root-shared"
fi

# --- Terraform deploy ---
echo "Initializing Terraform..."
terraform init
echo "Applying Terraform..."
terraform apply -auto-approve

# --- Generate config.json ---
echo "Generating config.json..."
API_URL=$(terraform output -raw api_endpoint)
USER_POOL_ID=$(terraform output -raw user_pool_id)
CLIENT_ID=$(terraform output -raw user_pool_client_id)

cat > ./config.json <<EOF
{
  "apiGatewayUrl": "$API_URL",
  "userPoolId": "$USER_POOL_ID",
  "userPoolClientId": "$CLIENT_ID"
}
EOF

echo "Deployment complete! config.json created for frontend."
