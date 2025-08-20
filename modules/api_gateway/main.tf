resource "aws_apigatewayv2_api" "http_api" {
  name          = var.api_name
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["https://${module.cloudfront.distribution_domain_name}", "http://localhost:63342"]              # Adjust if using a different local port or host
    allow_methods = ["GET", "POST", "PUT", "DELETE"]        # Match the API actions you use
    allow_headers = ["authorization", "content-type"]
  }
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = var.lambda_integration_uri # Reference for API Gateway which Lambda to call when someone hits this route
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_authorizer" "cognito_auth" {
  api_id          = aws_apigatewayv2_api.http_api.id
  name            = "CognitoAuthorizer"
  authorizer_type = "JWT"

  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [var.cognito_user_pool_client_id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

#resource "aws_apigatewayv2_route" "test" {
  #api_id    = aws_apigatewayv2_api.http_api.id
  #route_key = "GET /test"
  #target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
#}

resource "aws_apigatewayv2_route" "generate_upload_url" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /generate-upload-url"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_apigatewayv2_route" "download" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /download"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_apigatewayv2_route" "list" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /list"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}

resource "aws_apigatewayv2_route" "delete_file" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "DELETE /delete"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_auth.id
}


# Deploy the API on default stage (Live version of the API) in order to expose routes to the internet
# dev stage and prod stage options later
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default" # Maps to the root URL
  auto_deploy = true
}

resource "aws_lambda_permission" "allow_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
