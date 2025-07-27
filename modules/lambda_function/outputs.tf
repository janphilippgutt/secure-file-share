output "lambda_function_name" {
  value = aws_lambda_function.file_handler.function_name
}

#output "invoke_arn" {
  #value = aws_lambda_function.file_handler.invoke_arn
#}

#data "aws_region" "current" {}

output "lambda_integration_uri" {
  value = "arn:aws:apigateway:eu-central-1:lambda:path/2015-03-31/functions/${aws_lambda_function.file_handler.arn}/invocations"
}

output "lambda_invoke_arn" {
  value = aws_lambda_function.file_handler.invoke_arn
}