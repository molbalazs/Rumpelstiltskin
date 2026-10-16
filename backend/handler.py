"""
AWS Lambda handler — entry point for all API Gateway routes.
"""
import json


def lambda_handler(event: dict, context: object) -> dict:
    """Main Lambda entry point dispatched by API Gateway."""
    route = event.get("rawPath") or event.get("path", "")

    if route == "/health":
        return _health()

    return _not_found(route)


def _health() -> dict:
    """Health check endpoint — no dependencies, always fast."""
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"status": "ok"}),
    }


def _not_found(route: str) -> dict:
    return {
        "statusCode": 404,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"error": f"Route not found: {route}"}),
    }
