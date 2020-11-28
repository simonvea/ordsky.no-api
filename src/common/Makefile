build-OrdskyDepLayer:
		find . -name "*.ts" -type f -delete
		cp -r nodejs "$(ARTIFACTS_DIR)"
		npm install --only=prod --prefix "$(ARTIFACTS_DIR)/nodejs"