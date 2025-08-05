
# Deployment Guide

This guide covers additional deployment and configuration details for the Secure File Share project.

## **Quick Deployment**

The fastest way to deploy this project is by using the automated deployment script:

```commandline
chmod +x deploy.sh      # (only needed once to make the script executable)
./deploy.sh             # runs the full deployment
```

This will:

    Zip the Lambda code

    Deploy all infrastructure using Terraform

    Extract required output values

    Automatically generate the config.json file used by the frontend

### Running the Frontend

1. Create a test user in Cognito with username and password.
2. Open `index.html` in a browser.
2. Login with your Cognito credentials.
3. Upload, list, download, or delete files securely.

<img width="591" height="341" alt="Image" src="https://github.com/user-attachments/assets/e5c562a3-07d7-486f-bfa3-ce4f719b954f" />


## **Manual Deployment** (optional)

If you want to understand the underlying steps or need to deploy manually for troubleshooting, follow the instructions below.

### Terraform Outputs

After running terraform apply, you will get output values including:

    user_pool_id

    user_pool_client_id

    api_gateway_url

Make sure to use these outputs to configure the frontend script.js file (next step).

### Frontend Configuration

In your script.js, update the following constants with your Terraform outputs:

```
const poolData = {
  UserPoolId: '<your_user_pool_id>',
  ClientId: '<your_user_pool_client_id>',
};

```

And for the functions in the same script.js:

```

const backendUrl = '<your_api_endpoint>';

```
### Localhost CORS Configuration

During development, the S3 bucket’s CORS settings must allow requests from your local environment. This enables file uploads/downloads to work correctly when testing in the browser (e.g. via localhost).
Default (development) configuration in Terraform:

```
cors_configuration {
  allow_origins = ["http://localhost:63342"]         # Adjust if using a different local port or host
  allow_methods = ["GET", "POST", "PUT", "DELETE"]   # Match the API actions you use
  allow_headers = ["authorization", "content-type"]
}
```

Notes:

    Update allow_origins to match your actual local environment URL (e.g. http://127.0.0.1:5500 or http://localhost:3000).

    This setting is useful for local development only.

    For production, replace or restrict the allowed origins to your deployed frontend’s domain.

### Lambda Deployment

The Lambda function code needs to be zipped and uploaded to AWS Lambda. This project assumes:

    Your Lambda source code is in the lambda_src/ directory.

    You create a ZIP archive named lambda_payload.zip containing all necessary files and dependencies.

To create the ZIP:

```
cd modules/lambda_function/lambda_src
zip -r ../lambda_payload.zip .
cd ../../..
```

Run ```terraform apply```
