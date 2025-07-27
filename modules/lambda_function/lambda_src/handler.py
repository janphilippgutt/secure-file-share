import json
import boto3
import os

s3_client = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME')

# Providing a Lambda entry point
# Arguments:
# event: the input payload (e.g., JSON request from API Gateway)
# context: metadata about the invocation (timestamp, function name, memory, etc.)

def lambda_handler(event, context):
    print("Lambda triggered with event:", json.dumps(event))

    # 1. Extract the filename from the query parameters
    filename = event.get('queryStringParameters', {}).get('filename')
    if not filename:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Missing 'filename' in query parameters"})
        }

    # 2. Generate the presigned URL
    try:
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={'Bucket': BUCKET_NAME, 'Key': filename},
            ExpiresIn=300  # URL expires in 5 minutes
        )
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"upload_url": presigned_url})
        }

    except Exception as e:
        print("Error generating presigned URL:", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Could not generate presigned URL"})
        }