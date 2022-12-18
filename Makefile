POSTMAN_DIR := ${HOME}/Library/Application\ Support/Postman

list:
	ls ${POSTMAN_DIR}/backup*.json | sort -r | head -1

sync_from_postman:
	cp $(ls ${HOME}/Library/Application\ Support/Postman/backup*.json | sort -r | head -1) ./backup.json

convert:
	npm run convert
