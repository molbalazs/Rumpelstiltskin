.PHONY: install test test-bdd invoke dev-tables dev package clean

install:
	pip3 install -r requirements-dev.txt

test:
	pytest tests/unit -v

test-bdd:
	pytest tests/bdd -v

invoke:
	python3 -c "\
import json; \
from handler import lambda_handler; \
event = {'rawPath': '/health'}; \
resp = lambda_handler(event, None); \
print(json.dumps(resp, indent=2))"

# Local API on :3000 against LocalStack (docker compose up -d localstack)
dev-tables:
	python3 local_server.py --create-tables-only

dev:
	python3 local_server.py

package:
	pip3 install -r requirements.txt -t dist/
	cp -r handler.py rate_limiter.py game dist/
	cd dist && zip -r ../function.zip .
	rm -rf dist/

clean:
	rm -rf dist/ function.zip __pycache__ .pytest_cache
	find . -type d -name __pycache__ -exec rm -rf {} +
