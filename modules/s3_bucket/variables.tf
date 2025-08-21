variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "cloudfront_origin" {
  description = "The CloudFront domain to allow in CORS"
  type        = string
}