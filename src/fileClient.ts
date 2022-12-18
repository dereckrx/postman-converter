import * as Path from "path";
import {HttpsSchemaGetpostmanComJsonCollectionV210,} from "./PostmanTypes";
import {HttpCollection, HttpRequest} from "./convertCollection";
import {HttpEnvironment, PostmanEnvFile} from "./convertEnvironment";

const fs = require('fs');

const POSTMAN_ENVS_PATH = Path.join("..", "postman", "environments");
const POSTMAN_COLLECTIONS_PATH = Path.join("..", "postman", "collections");
const HTTP_OUTPUT_PATH = Path.join("..", "http");
const HTTP_ENV_FILE_NAME = "http-client.env.json";

interface FileClientConfig {
    postmanCollectionFilesPath: string;
    postmanEnvFilesPath: string;
    httpOutputPath: string;
    httpEnvFileName: string;
}

interface HttpFile {
    fileName: string;
    data: string;
}

const config: FileClientConfig = {
    postmanCollectionFilesPath: POSTMAN_COLLECTIONS_PATH,
    postmanEnvFilesPath: POSTMAN_ENVS_PATH,
    httpOutputPath: HTTP_OUTPUT_PATH,
    httpEnvFileName: HTTP_ENV_FILE_NAME,
}

export async function findAllPostmanEnvironments(): Promise<PostmanEnvFile[]> {
    return readFiles(config.postmanEnvFilesPath,".postman_environment.json");
}

export async function findAllPostmanCollections(): Promise<HttpsSchemaGetpostmanComJsonCollectionV210[]> {
    return readFiles(config.postmanCollectionFilesPath,".postman_collection.json");
}

export async function saveHttpEnvironment(httpEnvironments: HttpEnvironment) {
    return fs.promises.writeFile(
        Path.join(config.httpOutputPath, config.httpEnvFileName),
        JSON.stringify(httpEnvironments))
}

export async function saveHttpCollection({name, requests}: HttpCollection) {
    const dirPath = await createCollectionDir(name);

    return requests
        .map(toHttpFile)
        .map(({fileName, data}) =>
            fs.promises.writeFile(
                Path.join(dirPath, fileName),
                data
            ).catch(console.error)
    );
}

async function readFiles<T>(path: string, fileMatch: string): Promise<T[]> {
    const filesNames = (await fs.promises.readdir(path))
        .filter((fileName: string) => fileName.match(fileMatch));
    return (await Promise.all(
        filesNames.map((fileName: string) => {
            console.log(`Reading: ${fileName}`);
            return fs.promises.readFile(Path.join(path, fileName))
        })
    )).map(data => JSON.parse(data));
}

async function createCollectionDir(dirName: string) {
    const dirPath = Path.join(config.httpOutputPath, spaceToUnderscores(dirName));
    if (!fs.existsSync(dirPath)) {
        await fs.promises.mkdir(dirPath);
    }
    return dirPath;
}

export const spaceToUnderscores = (s: string) =>
    s.replace(/\s*-\s*/g, "-")
        .replace(/ /g, "_");

function toHttpFile(request: HttpRequest): HttpFile {

    const scriptSection = request.script.length > 0 ?
        ["> {%", ...request.script, "%}"] :
        [];

    const httpRequest = [
        "###",
        `# @name ${request.name}`,
        `${request.method} ${request.url}`,
        ...request.headers.map(({key, value}) => `${key}: ${value}`),
        "",
        request.body,
        "",
        ...scriptSection
    ].join("\n");

    return {
        fileName: `${spaceToUnderscores(request.name)}.http`,
        data: httpRequest
    }
}