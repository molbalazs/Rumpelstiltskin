.PHONY: install test test-bdd invoke package clean

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

package:
	pip3 install -r requirements.txt -t dist/
	cp handler.py rate_limiter.py dist/
	cd dist && zip -r ../function.zip .
	rm -rf dist/

clean:
	rm -rf dist/ function.zip __pycache__ .pytest_cache
	find . -type d -name __pycache__ -exec rm -rf {} +
