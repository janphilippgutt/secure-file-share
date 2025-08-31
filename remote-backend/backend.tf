terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.99.1"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.7.2"
    }
  }
}

resource "random_id" "backend_bucket_id" {
  byte_length = 4
}

resource "aws_s3_bucket" "tf_state" {
  bucket = "backend-bucket${random_id.backend_bucket_id.hex}"

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name = "Terraform State Bucket"
    Project = "Secure File Share"
  }
}

resource "aws_s3_bucket_versioning" "tf_state_versioning" {
  bucket = aws_s3_bucket.tf_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_dynamodb_table" "tf_state_lock" {
  name = "tf-lock-secure-file-share"
  billing_mode = "PAY_PER_REQUEST"
  hash_key = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name = "TF Lock Table"
    Project = "Secure File Share"
  }
}