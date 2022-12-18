backup=$(ls ${HOME}/Library/Application\ Support/Postman/backup*.json | sort -r | head -1)
echo ${backup}
ln -sf "${backup}" backup.json