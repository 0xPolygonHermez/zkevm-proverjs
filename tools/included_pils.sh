#!/bin/sh
grep '"fileName": ".*\.pil"' $1  | sed 's/.*"fileName": "\([^"]*\)".*/\1/' | sort | uniq | xargs