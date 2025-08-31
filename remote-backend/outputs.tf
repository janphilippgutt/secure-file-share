output "s3_tf-state_bucket_name" {
  value = aws_s3_bucket.tf_state.bucket
}

output "backend_dynamodb_table" {
  value = aws_dynamodb_table.tf_state_lock.name
}