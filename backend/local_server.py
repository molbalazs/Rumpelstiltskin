"""
Local stand-in for API Gateway: serves lambda_handler over HTTP on :3000,
against DynamoDB in LocalStack. For development and local e2e runs only.

    docker compose up -d localstack
    python3 local_server.py                       # creates tables if needed, then serves
    python3 local_server.py --create-tables-only
"""
import argparse
import contextlib
import os
import socket
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

os.environ.setdefault("AWS_ENDPOINT_URL", "http://localhost:4566")
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "test")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "test")
os.environ.setdefault("LLM_PROVIDER", "mock")
os.environ.setdefault("LLM_CALL_LOG_TABLE", "rumpelstiltskin-llm-calls")

import boto3  # noqa: E402  (env must be set first)

import rate_limiter  # noqa: E402
from game import sessions  # noqa: E402
from handler import lambda_handler  # noqa: E402

TABLES = {
    rate_limiter.TABLE_NAME: [("pk", "HASH"), ("sk", "RANGE")],
    sessions.TABLE_NAME: [("sessionId", "HASH")],
    os.environ["LLM_CALL_LOG_TABLE"]: [("sessionId", "HASH"), ("at", "RANGE")],
}

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


def create_tables() -> None:
    dynamodb = boto3.resource("dynamodb", endpoint_url=os.environ["AWS_ENDPOINT_URL"])
    existing = {t.name for t in dynamodb.tables.all()}
    for name, keys in TABLES.items():
        if name in existing:
            continue
        dynamodb.create_table(
            TableName=name,
            KeySchema=[{"AttributeName": k, "KeyType": t} for k, t in keys],
            AttributeDefinitions=[{"AttributeName": k, "AttributeType": "S"} for k, _ in keys],
            BillingMode="PAY_PER_REQUEST",
        ).wait_until_exists()
        print(f"created table {name}")


class DualStackServer(ThreadingHTTPServer):
    """Listens on IPv6 and IPv4, so "localhost" works whichever it resolves to."""

    address_family = socket.AF_INET6

    def server_bind(self):
        with contextlib.suppress(Exception):
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        super().server_bind()


class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self._send(204, {}, b"")

    def do_GET(self):
        self._invoke("GET")

    def do_POST(self):
        self._invoke("POST")

    def _invoke(self, method: str) -> None:
        length = int(self.headers.get("Content-Length") or 0)
        event = {
            "rawPath": self.path.split("?")[0],
            "requestContext": {"http": {"method": method}},
            "body": self.rfile.read(length).decode() if length else None,
        }
        response = lambda_handler(event, None)
        self._send(response["statusCode"], response.get("headers", {}), response["body"].encode())

    def _send(self, status: int, headers: dict, body: bytes) -> None:
        self.send_response(status)
        for key, value in {**headers, **CORS}.items():
            self.send_header(key, value)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--create-tables-only", action="store_true")
    parser.add_argument("--port", type=int, default=3000)
    args = parser.parse_args()
    create_tables()
    if not args.create_tables_only:
        print(f"Local API on http://localhost:{args.port} (cap {rate_limiter.GLOBAL_DAILY_CAP}/day)")
        DualStackServer(("::", args.port), Handler).serve_forever()
