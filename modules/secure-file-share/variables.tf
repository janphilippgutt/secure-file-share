variable "base_name" {
  description = "Base name for uniquely identifying resources"
  type        = string
}

variable "project" {
  description = "Friendly project name for tagging and identification"
  type        = string
}

variable "aws_region" {
  description = "The region to deploy resources"
  type        = string
}