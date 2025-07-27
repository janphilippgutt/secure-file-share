resource "aws_lambda_function" "file_handler" {
  function_name = var.lambda_name
  role          = var.lambda_role_arn
  handler       = "handler.lambda_handler" # Defining the function entry point
  runtime       = "python3.12"
  filename      = "${path.module}/lambda_payload.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda_payload.zip") # Ensures Terraform updates the Lambda code only when it changes

  environment {
    variables = {
      BUCKET_NAME = var.s3_bucket_name
    }
  }

  tags = var.tags
}
