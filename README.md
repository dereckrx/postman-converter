# Postman to Intellij HTTP Converter

## Quickstart

* Export your Postman collections and environments
* Place the `.postman_collection.json` and `.postman_environment.json` files in `/toConvert`
* Run `npm install && npm run convert`
* View converted files in `/converted`

## Supported Features

* Environments
* Collections
  * folders and request names are preserved
* Requests
  * headers
  * variables
  * JSON bodies (Non-JSON params might need some work)
* Test Scripts (mostly, see below)

## Currently Unsupported Features

* Pre-request scripts (IntelliJ recently added support)
* You might lose comments in test scripts, etc

## Supported Files

Currently only `.postman_collection.json` and `.postman_environment.json` are supported.

* If the parser does not know how to parse your requests, you will see `Unsupported request: ...`
* Parsing an entire Postman backup of many collections and envs is in development

### Converting test scripts

The `converScript.ts` module handles converting special postman test syntax into intelliJ http syntax.

* Not all cases are covered, and some might not be possible to convert 1-1 with IntelliJ http syntax
* You will see `Not sure how to convert script line: ...` if it's unsure how to convert a script line
* You might need update the module to support your use case or fix test scripts by hand after converting
