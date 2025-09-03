variable "aws_region" {
  description = "AWS region to deploy the resources"
  type        = string
}

variable "base_name" {
  description = "Appendage for merging into resource names for consistency across modules"
  type        = string
}

variable "project" {
  description = "Project name to label resources to a specific project"
  type        = string
}