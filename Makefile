develop:
	npm run develop

install:
	npm install

build:
	rm -rf dist
	NODE_ENV=production npx webpack

test:
	npm test
	
test-coverage:
	npm test -- --coverage --coverageProvider=v8

lint:
	npm run lint

.PHONY: test
