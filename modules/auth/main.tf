resource "aws_cognito_user_pool" "user_pool" {
  name = "secure-file-share-user-pool"
}

resource "aws_cognito_user_pool_client" "no_secret_client" {
  name         = "portfolio-client-no-secret"
  user_pool_id = aws_cognito_user_pool.user_pool.id

  # No client secret for frontend/public usage
  generate_secret = false

  # Allow common flows
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  prevent_user_existence_errors = "ENABLED"

  # Configure token validity (example: access token lasts 1h)
  access_token_validity = 24  # hours
  id_token_validity     = 24
  refresh_token_validity = 30 # days
}