
## Deployment Guide

This guide covers additional deployment and configuration details for the Secure File Share project.

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


### Running the Frontend

1. Create a test user in Cognito with username and password.
2. Open `index.html` in a browser.
2. Login with your Cognito credentials.
3. Upload, list, download, or delete files securely.



### Optional Enhancements

    Automate Lambda deployment within Terraform.

    Use environment variables or secrets management to inject sensitive info during build.

    Extend the backend for additional use-case related functionality. 