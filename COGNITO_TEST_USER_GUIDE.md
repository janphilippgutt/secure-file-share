## Cognito User Testing

After deployment, you need a user to log in to the Secure File Share frontend. Here’s how to create and test a Cognito user:

1️⃣ Create a new user

Use the AWS CLI:
```
aws cognito-idp admin-create-user \
    --user-pool-id <YOUR_USER_POOL_ID> \
    --username testuser \
    --user-attributes Name=email,Value=testuser@example.com \
    --temporary-password TempPass123!
```
<YOUR_USER_POOL_ID> comes from the Terraform output (terraform output -raw user_pool_id).

The user is created with a temporary password.

2️⃣ Set a permanent password

The temporary password requires the user to change it. To avoid issues in testing, set a permanent password via CLI:
```
aws cognito-idp admin-set-user-password \
    --user-pool-id <YOUR_USER_POOL_ID> \
    --username testuser \
    --password MySuperSecurePa123! \
    --permanent
```
This bypasses the “newPasswordRequired” flow.

Password must meet the user pool policy (min. length, special characters, etc.).

3️⃣ Log in to the frontend

Open your instance’s frontend in a browser:
```
root-instance-<instance-name>/index.html
```
Enter credentials:

Username: testuser

Password: MySecurePass123!

You should now be able to upload, download, and delete files.

4️⃣ Troubleshooting login issues

If you see n.newPasswordRequired errors → check that the password was set as permanent.

If login fails → verify the user pool ID and client ID in config.json.