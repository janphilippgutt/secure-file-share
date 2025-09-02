terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.81.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.6.3"
    }
  }
  # backend "s3" {} # Only if state is managed remotely
}
provider "aws" {
  region = var.aws_region
}

module "s3_bucket" {
  source = "../s3_bucket"

  bucket_name       = "${var.base_name}-secure-file-share-${random_id.bucket_id.hex}"
  cloudfront_origin = module.deploy_frontend.cloudfront_domain
  tags = {
    Project = var.project
  }
}

resource "random_id" "bucket_id" {
  byte_length = 4
}

module "iam_roles" {
  source         = "../iam_roles"
  role_name      = "${var.base_name}-lambda-secure-share-role"
  s3_bucket_name = module.s3_bucket.bucket_name # Passing the output from the s3_bucket module into the iam_roles module
  tags = {
    Project = var.project
  }
}

module "lambda_function" {
  source          = "../lambda_function"
  lambda_name     = "${var.base_name}-file-share-handler"
  lambda_role_arn = module.iam_roles.lambda_role_arn
  s3_bucket_name  = module.s3_bucket.bucket_name
  tags = {
    Project = var.project
  }
}

module "api_gateway" {
  source                 = "../api_gateway"
  api_name               = "${var.base_name}-secure-file-api"
  lambda_function_name   = module.lambda_function.lambda_function_name
  lambda_invoke_arn      = module.lambda_function.lambda_invoke_arn
  lambda_integration_uri = module.lambda_function.lambda_integration_uri

  cognito_user_pool_id        = module.auth.user_pool_id
  cognito_user_pool_client_id = module.auth.user_pool_client_id
  aws_region                  = var.aws_region
  cloudfront_origin           = module.deploy_frontend.cloudfront_domain
}

module "auth" {
  source    = "../auth"
  base_name = var.base_name
}

module "deploy_frontend" {
  source    = "../deploy-frontend"
  base_name = var.base_name
}