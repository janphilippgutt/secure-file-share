output "s3_bucket_name" {
  value = module.s3_bucket.bucket_name
}

output "lambda_role_arn" {
  value = module.iam_roles.lambda_role_arn
}

output "lambda_function_name" {
  value = module.lambda_function.lambda_function_name
}

output "api_endpoint" {
  value = module.api_gateway.api_endpoint
}

output "lambda_invoke_arn" {
  value = module.lambda_function.lambda_invoke_arn
}

output "lambda_integration_uri" {
  value = module.lambda_function.lambda_integration_uri
}

output "user_pool_client_id" {
  value = module.auth.user_pool_client_id
}