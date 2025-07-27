import json


# Providing a Lambda entry point
# Arguments:
# event: the input payload (e.g., JSON request from API Gateway)
# context: metadata about the invocation (timestamp, function name, memory, etc.)

def lambda_handler(event, context):
    print("Lambda triggered:", json.dumps(event))
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps({"message": "Lambda is working!"})
    }