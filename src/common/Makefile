build-OrdskyDepLayer:
	cd gw-helpers && npm install --only=prod && npm run build
	npm install --only=prod
	mkdir $(ARTIFACTS_DIR)/nodejs
	cp -r node_modules "$(ARTIFACTS_DIR)/nodejs/node_modules"
