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
  region = "eu-central-1"
}


data "terraform_remote_state" "secure_file_share" {
  backend = "s3"
  config = {
    bucket = var.backend_bucket
    key = "secure-file-share/terraform.tfstate"
    region = "eu-central-1"
  }
}

locals {
  file_share_bucket = data.terraform_remote_state.secure_file_share.outputs.s3_bucket_name
  cloudfront_domain = data.terraform_remote_state.secure_file_share.outputs.cloudfront_domain
}

output "project_A_bucket" {
  value = local.file_share_bucket
}

output "cloudfront_domain" {
  value = local.cloudfront_domain
}