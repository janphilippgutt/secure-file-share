import json
import os
import re
import boto3
from botocore.exceptions import ClientError

s3_client = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME')
MAX_BUCKET_USAGE = 4.5 * 1024 * 1024 * 1024  # 4.5 GB

# ---- helpers ----

SAFE_FILENAME_RE = re.compile(r"^[\w\-. ]{1,200}$")

def sanitize_filename(name: str) -> str:
    """
    Only allow simple filenames (no slashes, no traversal).
    Adjust the regex to your needs.
    """
    if not name or "/" in name or "\\" in name or not SAFE_FILENAME_RE.match(name):
        raise ValueError("Invalid filename")
    return name

def get_user_id(event) -> str:
    """
    Extract the stable user identity from the JWT (preferred: 'sub').
    API Gateway (HTTP API) puts JWT claims here:
      event.requestContext.authorizer.jwt.claims
    """
    try:
        claims = event["requestContext"]["authorizer"]["jwt"]["claims"]
        return claims.get("sub") or claims.get("cognito:username") or claims.get("username")
    except Exception:
        return None

def key_for(user_id: str, filename: str) -> str:
    return f"{user_id}/{filename}"

def get_bucket_size(bucket_name):
    total_size = 0
    paginator = s3_client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket_name):
        for obj in page.get("Contents", []):
            total_size += obj["Size"]
    return total_size

def respond(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "http://localhost:63342",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,PUT,DELETE,OPTIONS"
        },
        "body": json.dumps(body),
    }

# ---- main handler ----

def lambda_handler(event, context):
    path = event.get("rawPath")
    query_params = event.get("queryStringParameters") or {}
    user_id = get_user_id(event)
    if not user_id:
        return respond(401, {"error": "Unauthorized: no user identity"})

    try:
        if path in ["/upload", "/generate-upload-url"]:
            filename = sanitize_filename(query_params.get("filename", ""))
            file_size = int(query_params.get("size", "0") or 0)

            if get_bucket_size(BUCKET_NAME) + file_size > MAX_BUCKET_USAGE:
                return respond(403, {"error": "Bucket storage limit reached"})

            s3_key = key_for(user_id, filename)
            upload_url = s3_client.generate_presigned_url(
                "put_object",
                Params={"Bucket": BUCKET_NAME, "Key": s3_key},
                ExpiresIn=3600,
            )
            return respond(200, {"upload_url": upload_url})

        elif path == "/download":
            filename = sanitize_filename(query_params.get("filename", ""))
            s3_key = key_for(user_id, filename)
            # (Optional) check existence for nicer 404s
            try:
                s3_client.head_object(Bucket=BUCKET_NAME, Key=s3_key)
            except ClientError as e:
                code = e.response.get("ResponseMetadata", {}).get("HTTPStatusCode", 404)
                if code == 404:
                    return respond(404, {"error": "File not found"})
                raise

            download_url = s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": BUCKET_NAME, "Key": s3_key},
                ExpiresIn=3600,
            )
            return respond(200, {"download_url": download_url})

        elif path == "/list":
            # Only list objects with this user's prefix
            prefix = f"{user_id}/"
            files = []
            paginator = s3_client.get_paginator("list_objects_v2")
            for page in paginator.paginate(Bucket=BUCKET_NAME, Prefix=prefix):
                for obj in page.get("Contents", []):
                    # Strip "<user_id>/" so the UI shows just the filename
                    key = obj["Key"]
                    files.append(key[len(prefix):])

            return respond(200, {"files": files})

        elif path == "/delete":
            filename = sanitize_filename(query_params.get("filename", ""))
            s3_key = key_for(user_id, filename)
            try:
                s3_client.delete_object(Bucket=BUCKET_NAME, Key=s3_key)
                return respond(200, {"message": f"Deleted {filename}"})
            except Exception as e:
                return respond(500, {"error": str(e)})

        else:
            return respond(404, {"error": "Route not found"})

    except ValueError as ve:
        # From sanitize_filename or parsing
        return respond(400, {"error": str(ve)})
    except Exception as e:
        return respond(500, {"error": str(e)})
