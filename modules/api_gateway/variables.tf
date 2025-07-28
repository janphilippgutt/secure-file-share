variable "api_name" {
  description = "Name of the API Gateway"
  type        = string
}

variable "lambda_function_name" {
  description = "Name of the Lambda function to invoke"
  type        = string
}

variable "lambda_invoke_arn" {
   description = "Lambda function's invoke ARN"
   type        = string
}

variable "lambda_integration_uri" {
  description = "Lambda function's integration uri"
  type = string
}

variable "cognito_user_pool_id" {}
variable "cognito_user_pool_client_id" {}
variable "aws_region" {}
