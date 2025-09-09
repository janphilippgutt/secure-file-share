# 🚀 Secure File Share – Deployment Guide

This guide explains how to deploy the Secure File Share project using the unified deployment script.
The project supports two deployment approaches:

**Instance Mode** → creates a self-contained, local-state deployment of Secure File Share.

**Shared Mode** → deploys a shared root stack with a remote backend (S3 + DynamoDB), and can be consumed by other Terraform projects (e.g., root-consumer).

## 📦 Prerequisites

Before running the script, ensure you have:

- AWS CLI installed and configured with appropriate credentials.

- Terraform installed (use the pinned version if specified in the repo).

- Bash shell (Linux, macOS, or WSL recommended).

- IAM permissions to create and manage: S3, CloudFront, API Gateway, Lambda, Cognito, DynamoDB

## 🔑 Step 1 – Clone the Repository

```
git clone <repo-url>
cd secure-file-share
```

## ⚙️ Step 2 – Deployment Modes

### Option A: Instance Mode (default)

Deploys a new, isolated Secure File Share instance with local Terraform state.
Good for quick testing, demos, and independent deployments.

Run:

```
./deploy.sh my-instance # Replace <my-instance> with an instance name of your choice
```

You will be prompted for:

- base_name → lowercase letters/numbers/hyphens (used for bucket & resource names).

- project → defaults to secure-file-share.

- aws_region → defaults to eu-central-1.

This creates:

- A dedicated S3 bucket for file storage

- CloudFront distribution + frontend hosting

- API Gateway + Lambda for presigned URLs

- Cognito User Pool for authentication

After terraform apply, a config.json will be generated in the instance folder (used by the frontend).

👉 Copy the files now present in your projects frontend/ -folder into the s3-static-site bucket created with terrafrom apply (script), login and start uploading/downloading files.

👉 Create a Cognito user (see COGNITO_TEST_USER_GUIDE.md)

👉 Login and start uploading/downloading files

### Option B: Shared Mode

Set up a remote Terraform state in S3 + DynamoDB with resources like in remote-backend/.
(Or see https://github.com/janphilippgutt/aws-backend-setup for remote-backend setup in detail).

Run:
```
./deploy.sh shared
```
which deploys a shared root stack with Secure File Share resources (bucket, CloudFront, API Gateway, Cognito).

This is recommended for production or team use, where state locking and shared outputs are important.

### Option C: Consumer Mode (example of how to reuse)

root-consumer shows how another project can read outputs (bucket name, CloudFront domain) from the shared root using terraform_remote_state.

Run:
```
cd root-consumer
terraform init
terraform apply
```
This allows other projects to integrate with the shared deployment without duplicating infrastructure.

## 🧹 Step 3 – Cleanup

- To destroy an instance:
```
cd root-instance-<name>
terraform destroy
```

- To destroy the shared root:
```
cd root-shared
terraform destroy
```

⚠️ Do not just delete local folders without destroying, or you risk leaving orphaned AWS resources.

## 🚦 When to Use What?

- Quick test / demo → use **Instance Mode** (no shared root needed).

- Centralized / production → deploy **Shared Mode** once, then let others consume outputs.

- Showcasing module reuse → use **Consumer Mode** with terraform_remote_state.

## With this structure:

- Instances are self-sufficient (local state).

- Shared root demonstrates remote backend & cross-project reuse.

- Consumer root is a reference example.

