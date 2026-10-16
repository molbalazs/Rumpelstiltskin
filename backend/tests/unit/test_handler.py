"""Unit tests for the Lambda handler."""
import json
import pytest
from handler import lambda_handler


def _event(path: str) -> dict:
    """Build a minimal API Gateway v2 event."""
    return {"rawPath": path, "requestContext": {}}


def test_health_returns_200():
    response = lambda_handler(_event("/health"), None)

    assert response["statusCode"] == 200


def test_health_body_contains_status_ok():
    response = lambda_handler(_event("/health"), None)
    body = json.loads(response["body"])

    assert body["status"] == "ok"


def test_unknown_route_returns_404():
    response = lambda_handler(_event("/unknown"), None)

    assert response["statusCode"] == 404
