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

  # Optional: Useful for Hosted UI / OAuth (can be left out if unused)
  callback_urls = ["http://localhost:3000"]
  logout_urls   = ["http://localhost:3000"]

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  supported_identity_providers         = ["COGNITO"]
}



