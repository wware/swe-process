.PHONY: build run test test-watch clean

build:
	docker-compose build

run:
	docker-compose up app

test:
	docker-compose run --rm test

test-watch:
	docker-compose run --rm test pytest -xvs --no-header --no-summary -f

clean:
	docker-compose down
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
