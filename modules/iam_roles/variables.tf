variable "role_name" {
  description = "Name for the Lambda execution role"
  type = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type = map(string)
  default = {}
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket the Lambda will access"
  type = string
}