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
}
provider "aws" {
  region = var.aws_region
}

module "s3_bucket" {
  source = "./modules/s3_bucket"

  bucket_name = "secure-file-share-${random_id.bucket_id.hex}"
  tags = {
    Project = "SecureFileShare"
    Owner = "JP"
  }
}

resource "random_id" "bucket_id" {
  byte_length = 4
}

module "iam_roles" {
  source = "./modules/iam_roles"
  role_name = "lambda-secure-share-role"
  s3_bucket_name = module.s3_bucket.bucket_name # Passing the output from the s3_bucket module into the iam_roles module
  tags = {
    Project = "SecureFileShare"
    Owner = "JP"
  }
}

module "lambda_function" {
  source = "./modules/lambda_function"
  lambda_name = "file-share-handler"
  lambda_role_arn = module.iam_roles.lambda_role_arn
  s3_bucket_name = module.s3_bucket.bucket_name
  tags = {
    Project = "SecureFileShare"
    Owner = "JP"
  }
}

module "api_gateway" {
  source                = "./modules/api_gateway"
  api_name              = "secure-file-api"
  lambda_function_name  = module.lambda_function.lambda_function_name
  lambda_invoke_arn = module.lambda_function.lambda_invoke_arn
  lambda_integration_uri = module.lambda_function.lambda_integration_uri

  cognito_user_pool_id     = module.auth.user_pool_id
  cognito_user_pool_client_id = module.auth.user_pool_client_id
  aws_region               = var.aws_region
}

module "auth" {
  source = "./modules/auth"
}