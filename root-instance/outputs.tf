
output "s3_bucket_name" {
  value = module.secure_file_share.s3_bucket_name
}

output "lambda_role_arn" {
  value = module.secure_file_share.lambda_role_arn
}

output "lambda_function_name" {
  value = module.secure_file_share.lambda_function_name
}

output "api_endpoint" {
  value = module.secure_file_share.api_endpoint
}

output "lambda_invoke_arn" {
  value = module.secure_file_share.lambda_invoke_arn
}

output "lambda_integration_uri" {
  value = module.secure_file_share.lambda_integration_uri
}

output "user_pool_id" {
  value = module.secure_file_share.user_pool_id
}

output "user_pool_client_id" {
  value = module.secure_file_share.user_pool_client_id
}

output "s3_static_site_bucket_name" {
  value = module.secure_file_share.s3_static_site_bucket_name
}

output "cloudfront_domain" {
  value = module.secure_file_share.cloudfront_domain
}