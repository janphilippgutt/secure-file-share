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
    path = event.get("rawPath")
    query_params = event.get("queryStringParameters") or {}

    if path in ["/upload", "/generate-upload-url"]:
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

    elif path == "/list":
        return handle_list_files()

    elif path == "/delete":
        filename = query_params.get("filename")
        if not filename:
            return respond(400, "Missing 'filename' query parameter")

        try:
            s3_client.delete_object(Bucket=BUCKET_NAME, Key=filename)
            return respond(200, {"message": f"Deleted {filename}"})
        except Exception as e:
            return respond(500, {"error": str(e)})


    else:
        return respond(404, "Route not found")

def handle_list_files():
    try:
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME)
        files = [item["Key"] for item in response.get("Contents", [])]
        return respond(200, {"files": files})
    except Exception as e:
        return respond(500, {"error": str(e)})

def respond(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
