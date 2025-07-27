import json
import boto3
import os
import urllib.parse

s3_client = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME')

# Providing a Lambda entry point
# Arguments:
# event: the input payload (e.g., JSON request from API Gateway)
# context: metadata about the invocation (timestamp, function name, memory, etc.)

def lambda_handler(event, context):
    path = event.get("rawPath")
    query_params = event.get("queryStringParameters") or {}

    if path == "/upload":
        filename = query_params.get("filename")
        if not filename:
            return respond(400, "Missing 'filename' query parameter")

        upload_url = s3_client.generate_presigned_url(
            "put_object",
            Params={"Bucket": BUCKET_NAME, "Key": filename},
            ExpiresIn=3600,
        )
        return respond(200, {"upload_url": upload_url})

    elif path == "/download":
        filename = query_params.get("filename")
        if not filename:
            return respond(400, "Missing 'filename' query parameter")

        download_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET_NAME, "Key": filename},
            ExpiresIn=3600,
        )
        return respond(200, {"download_url": download_url})

    else:
        return respond(404, "Route not found")


def respond(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
